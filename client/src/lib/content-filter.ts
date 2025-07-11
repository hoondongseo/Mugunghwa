const inappropriateKeywords = [
  // Political inappropriate terms
  "바보", "멍청이", "개새끼", "씨발", "좆", "병신", "미친", "죽어", "꺼져",
  // Hate speech
  "혐오", "차별", "폭력", "테러", "살인", "자살",
  // Spam indicators
  "광고", "홍보", "클릭", "링크", "사이트", "돈", "벌기",
];

const positiveKeywords = [
  "응원", "파이팅", "감사", "존경", "사랑", "희망", "미래", "발전", "번영",
  "행복", "평화", "안전", "건강", "성공", "축복", "기원", "소망", "믿음",
  "신뢰", "지지", "격려", "칭찬", "감동", "자랑", "대한민국", "한국",
];

export function filterContent(content: string): boolean {
  const lowerContent = content.toLowerCase();
  
  // Check for inappropriate keywords
  const hasInappropriateContent = inappropriateKeywords.some(keyword => 
    lowerContent.includes(keyword)
  );
  
  if (hasInappropriateContent) {
    return false;
  }
  
  // Check for positive keywords (optional - could be used for scoring)
  const hasPositiveContent = positiveKeywords.some(keyword => 
    lowerContent.includes(keyword)
  );
  
  // Basic length checks
  if (content.length < 10 || content.length > 500) {
    return false;
  }
  
  // Check for spam patterns (repeated characters, all caps, etc.)
  if (/(.)\1{4,}/.test(content)) { // 5+ repeated characters
    return false;
  }
  
  if (content.toUpperCase() === content && content.length > 50) { // All caps and long
    return false;
  }
  
  return true;
}

export function getContentScore(content: string): number {
  let score = 0;
  const lowerContent = content.toLowerCase();
  
  // Add points for positive keywords
  positiveKeywords.forEach(keyword => {
    if (lowerContent.includes(keyword)) {
      score += 1;
    }
  });
  
  // Subtract points for inappropriate keywords
  inappropriateKeywords.forEach(keyword => {
    if (lowerContent.includes(keyword)) {
      score -= 3;
    }
  });
  
  // Length bonus
  if (content.length >= 20 && content.length <= 200) {
    score += 1;
  }
  
  return Math.max(0, score);
}
