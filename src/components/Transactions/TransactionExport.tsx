import { useState } from "react";
import { Download, FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { UnifiedTransaction } from "@/hooks/useTransactionHistory";

interface TransactionExportProps {
  transactions: UnifiedTransaction[];
  filename?: string;
}

export function TransactionExport({ transactions, filename = "FUN_Play_Transactions" }: TransactionExportProps) {
  const [exporting, setExporting] = useState<"csv" | "pdf" | null>(null);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "tip": return "Tip";
      case "donate": return "Ung ho";
      case "reward": return "Thuong";
      case "claim": return "Rut thuong";
      case "transfer": return "Chuyen tien";
      default: return type;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "success": return "Thanh cong";
      case "pending": return "Cho xu ly";
      case "failed": return "That bai";
      default: return status;
    }
  };

  const exportCSV = async () => {
    try {
      setExporting("csv");
      
      const headers = [
        "Thoi gian",
        "Loai giao dich",
        "Nguoi gui",
        "Vi gui",
        "Nguoi nhan",
        "Vi nhan",
        "Token",
        "So luong",
        "Noi dung",
        "Trang thai",
        "Onchain",
        "Chain",
        "TX Hash",
        "Link Explorer"
      ].join(",");

      const rows = transactions.map(t => {
        const explorerUrl = t.tx_hash ? `https://bscscan.com/tx/${t.tx_hash}` : "";
        return [
          `"${formatDate(t.created_at)}"`,
          `"${getTypeLabel(t.transaction_type)}"`,
          `"${t.sender_display_name}"`,
          `"${t.wallet_from_full || ""}"`,
          `"${t.receiver_display_name}"`,
          `"${t.wallet_to_full || ""}"`,
          `"${t.token_symbol}"`,
          t.amount,
          `"${t.message || ""}"`,
          `"${getStatusLabel(t.status)}"`,
          t.is_onchain ? "Co" : "Khong",
          `"${t.chain || ""}"`,
          `"${t.tx_hash || ""}"`,
          `"${explorerUrl}"`
        ].join(",");
      }).join("\n");

      // Add BOM for Excel UTF-8 compatibility
      const bom = "\uFEFF";
      const csvContent = bom + headers + "\n" + rows;
      
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      
      link.setAttribute("href", url);
      link.setAttribute("download", `${filename}_${new Date().toISOString().split("T")[0]}.csv`);
      link.style.visibility = "hidden";
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success("Đã xuất CSV thành công!", {
        description: `${transactions.length} giao dịch đã được xuất.`
      });
    } catch (error) {
      console.error("Error exporting CSV:", error);
      toast.error("Lỗi khi xuất CSV");
    } finally {
      setExporting(null);
    }
  };

  const exportPDF = async () => {
    try {
      setExporting("pdf");
      
      const doc = new jsPDF({ orientation: "landscape" });
      
      // Header
      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.setTextColor(255, 215, 0); // Gold color
      doc.text("FUN PLAY", 14, 15);
      
      doc.setFontSize(14);
      doc.setTextColor(100, 100, 100);
      doc.text("LICH SU GIAO DICH", 14, 23);
      
      // Metadata
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(120, 120, 120);
      doc.text(`Xuat ngay: ${new Date().toLocaleString("vi-VN")}`, 14, 30);
      doc.text(`Tong so giao dich: ${transactions.length}`, 14, 36);
      
      // Table
      autoTable(doc, {
        startY: 42,
        head: [[
          "Thoi gian",
          "Loai",
          "Nguoi gui",
          "Nguoi nhan",
          "So luong",
          "Token",
          "Trang thai",
          "Onchain"
        ]],
        body: transactions.map(t => [
          formatDate(t.created_at),
          getTypeLabel(t.transaction_type),
          t.sender_display_name.substring(0, 15),
          t.receiver_display_name.substring(0, 15),
          t.amount.toLocaleString("vi-VN"),
          t.token_symbol,
          getStatusLabel(t.status),
          t.is_onchain ? "Co" : "Khong"
        ]),
        theme: "grid",
        headStyles: {
          fillColor: [255, 215, 0],
          textColor: [0, 0, 0],
          fontStyle: "bold",
          fontSize: 8,
        },
        bodyStyles: {
          fontSize: 7,
        },
        alternateRowStyles: {
          fillColor: [250, 250, 250],
        },
        margin: { left: 14, right: 14 },
      });

      // Footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(
          "Xuat tu FUN PLAY • Blockchain Transparent • Web3 Standard",
          doc.internal.pageSize.width / 2,
          doc.internal.pageSize.height - 10,
          { align: "center" }
        );
        doc.text(
          `Trang ${i} / ${pageCount}`,
          doc.internal.pageSize.width - 20,
          doc.internal.pageSize.height - 10,
          { align: "right" }
        );
      }

      doc.save(`${filename}_${new Date().toISOString().split("T")[0]}.pdf`);
      
      toast.success("Đã xuất PDF thành công!", {
        description: `${transactions.length} giao dịch đã được xuất.`
      });
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast.error("Lỗi khi xuất PDF");
    } finally {
      setExporting(null);
    }
  };

  const disabled = transactions.length === 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          disabled={disabled || !!exporting}
          className="gap-2"
        >
          {exporting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          Xuất dữ liệu
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={exportCSV} disabled={!!exporting} className="gap-2 cursor-pointer">
          <FileSpreadsheet className="h-4 w-4 text-green-600" />
          Xuất CSV (Excel)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportPDF} disabled={!!exporting} className="gap-2 cursor-pointer">
          <FileText className="h-4 w-4 text-red-600" />
          Xuất PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
