import { useParams, useSearchParams, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getVideoPath } from "@/lib/videoNavigation";
import NotFound from "./NotFound";

const WatchLegacyRedirect = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const [redirectPath, setRedirectPath] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const resolve = async () => {
      if (!id) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      // Preserve query params (like ?t=120&list=xxx)
      const qp = searchParams.toString();
      const queryString = qp ? `?${qp}` : '';
      
      const path = await getVideoPath(id, queryString);
      
      // If getVideoPath returned a /watch/ fallback, video wasn't found
      if (path.startsWith('/watch/')) {
        setNotFound(true);
      } else {
        setRedirectPath(path);
      }
      setLoading(false);
    };

    resolve();
  }, [id, searchParams]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (notFound) return <NotFound />;
  if (redirectPath) return <Navigate to={redirectPath} replace />;

  return null;
};

export default WatchLegacyRedirect;
