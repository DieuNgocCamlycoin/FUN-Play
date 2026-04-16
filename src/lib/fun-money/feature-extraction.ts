/**
 * Feature Extraction Types & Utilities for PPLP Engine v2.0
 * NLP analysis types and helpers for AI-powered scoring
 */

import type { FeatureExtraction, FraudResult, PPLPv2Input, ActivityType } from './pplp-engine-v2';

// ===== DEFAULT FEATURES (for offline/fallback mode) =====

export function getDefaultFeatures(activityType: ActivityType): FeatureExtraction {
  const base: FeatureExtraction = {
    gratitude_score: 0.3,
    repentance_score: 0.1,
    ego_signal: 0.2,
    authenticity: 0.5,
    love_tone: 0.3,
    consistency: 0.3,
    depth: 0.3,
    response_quality: 0.5,
    community_impact: 0.2,
    engagement_quality: 0.3,
  };

  // Adjust defaults by activity type
  switch (activityType) {
    case 'meditation':
      base.repentance_score = 0.5;
      base.gratitude_score = 0.5;
      base.ego_signal = 0.1;
      base.depth = 0.5;
      break;
    case 'donation':
      base.gratitude_score = 0.6;
      base.community_impact = 0.5;
      base.ego_signal = 0.15;
      break;
    case 'coaching':
      base.community_impact = 0.6;
      base.depth = 0.6;
      base.response_quality = 0.6;
      break;
    case 'volunteer':
      base.community_impact = 0.7;
      base.gratitude_score = 0.5;
      break;
  }

  return base;
}

export function getDefaultFraudResult(): FraudResult {
  return {
    fraud_score: 0,
    confidence: 0.5,
    flags: [],
  };
}

// ===== AI ANALYSIS PROMPT BUILDER =====

/**
 * Build the system prompt for PPLP AI analysis
 */
export function buildAnalysisSystemPrompt(): string {
  return `Bạn là PPLP AI — hệ thống phân tích giá trị thật của hành động con người.

Bạn đánh giá dựa trên 5 trụ cột:
1. Sám Hối — nhận ra lỗi lầm, chuyển hoá
2. Biết Ơn — lòng biết ơn chân thành
3. Phụng Sự — hành động vì cộng đồng
4. Giúp Đỡ — hỗ trợ người khác thực tế
5. Trao Tặng — cho đi vô điều kiện

QUY TẮC PHÂN TÍCH:
- Đo chất lượng, KHÔNG đo số lượng
- Ego cao = điểm thấp
- Giúp người thật = điểm cao
- Nội dung sao chép/spam = điểm rất thấp
- Tìm "linh hồn của hành động" — không tin bề mặt

Trả về JSON với tool call chính xác theo schema.`;
}

/**
 * Build the user prompt for analyzing a specific action
 */
export function buildAnalysisUserPrompt(input: PPLPv2Input): string {
  return `Phân tích hành động này:

Platform: ${input.platform}
Loại: ${input.activity_type}
Nội dung: ${input.content}
Metrics: likes=${input.metrics.likes || 0}, comments=${input.metrics.comments || 0}, shares=${input.metrics.shares || 0}, watch_time=${input.metrics.watch_time || 0}s
Bằng chứng: ${input.proof_link}
Thời gian: ${input.timestamp}

Hãy phân tích sâu: 
- Ý định thật (intent) đằng sau hành động
- Có chuyển hoá thật không (depth)
- Có ego cao không
- Có giúp người thật không
- Mức độ chân thành`;
}

// ===== ANALYSIS TOOL SCHEMA =====

export const ANALYSIS_TOOL_SCHEMA = {
  name: 'analyze_pplp_action',
  description: 'Phân tích giá trị thật của hành động con người theo 5 trụ cột PPLP',
  parameters: {
    type: 'object',
    properties: {
      gratitude_score: { type: 'number', description: 'Mức độ Biết Ơn (0-1)' },
      repentance_score: { type: 'number', description: 'Mức độ Sám Hối/chuyển hoá (0-1)' },
      ego_signal: { type: 'number', description: 'Dấu hiệu bản ngã/ego (0-1, cao = xấu)' },
      authenticity: { type: 'number', description: 'Độ chân thật (0-1)' },
      love_tone: { type: 'number', description: 'Năng lượng yêu thương (0-1)' },
      depth: { type: 'number', description: 'Độ sâu nội dung/chuyển hoá thật (0-1)' },
      community_impact: { type: 'number', description: 'Ảnh hưởng tích cực lên cộng đồng (0-1)' },
      response_quality: { type: 'number', description: 'Chất lượng phản hồi/tương tác (0-1)' },
      reasoning: { type: 'string', description: 'Giải thích ngắn lý do cho các điểm số' },
    },
    required: [
      'gratitude_score', 'repentance_score', 'ego_signal',
      'authenticity', 'love_tone', 'depth',
      'community_impact', 'response_quality', 'reasoning',
    ],
    additionalProperties: false,
  },
};

// ===== FRAUD DETECTION TOOL SCHEMA =====

export const FRAUD_TOOL_SCHEMA = {
  name: 'detect_fraud',
  description: 'Phát hiện gian lận trong hành động PPLP',
  parameters: {
    type: 'object',
    properties: {
      fraud_score: { type: 'number', description: 'Mức độ gian lận (0-1)' },
      confidence: { type: 'number', description: 'Độ tin cậy của đánh giá (0-1)' },
      flags: {
        type: 'array',
        items: { type: 'string' },
        description: 'Các cờ cảnh báo: spam, fake_engagement, bot_behavior, multi_account, copy_paste',
      },
      reasoning: { type: 'string', description: 'Giải thích ngắn' },
    },
    required: ['fraud_score', 'confidence', 'flags', 'reasoning'],
    additionalProperties: false,
  },
};
