import { Question } from './types';
import { DANHGIA_URL, API_ROUTING } from './config';

export let questionsBankW: Question[] = [];

// Hàm trộn mảng ngẫu nhiên cơ bản
const shuffle = <T>(arr: T[]) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
const shuffleOptions = (q: any) => {
  if (!q.options) return q;

  let optionsArray: any[] = [];

  // Vì sheet lưu string JSON
  if (typeof q.options === "string") {
    try {
      optionsArray = JSON.parse(q.options);
    } catch {
      optionsArray = [];
    }
  } else if (Array.isArray(q.options)) {
    optionsArray = q.options;
  }

  if (!Array.isArray(optionsArray) || optionsArray.length === 0) return q;

  const shuffled = shuffle(optionsArray);

  return {
    ...q,
    options: shuffled
  };
};

const shuffleByTypeParts = (data: Question[]): Question[] => {
  const mcq: Question[] = [];
  const tf: Question[] = [];
  const sa: Question[] = [];
  const other: Question[] = [];

  data.forEach(q => {
    const type = (q.type || '').toLowerCase().trim();

    if (type === 'mcq') mcq.push(q);
    else if (type === 'true-false') tf.push(q);
    else if (type === 'short-answer') sa.push(q);
    else other.push(q);
  });

  const mixed = [
    ...shuffle(mcq),
    ...shuffle(tf),
    ...shuffle(sa),
    ...shuffle(other)
  ];

  // 🔥 Trộn đáp án MCQ
  return mixed.map(q =>
    q.type === "mcq" ? shuffleOptions(q) : q
  );
};

export const fetchQuestionsBankW = async (
  examCode?: string,
  idgv?: string,
  customUrl?: string
): Promise<Question[]> => {
  try {
    let targetUrl = DANHGIA_URL;
    if (customUrl) {
      targetUrl = customUrl;
    } else if (idgv && API_ROUTING[idgv]) {
      targetUrl = API_ROUTING[idgv];
    }

    const finalUrl = examCode
      ? `${targetUrl}?action=getQuestionsByCode&examCode=${examCode}`
      : `${targetUrl}?action=getQuestions`;

    const response = await fetch(finalUrl);
    const result = await response.json();

    if (result.status === "success" && Array.isArray(result.data)) {

  // 🔥 Parse option từ sheet (string -> array)
  const normalized = result.data.map((q: any) => {
    let parsedOptions = [];

    if (typeof q.option === "string") {
      try {
        parsedOptions = JSON.parse(q.option);
      } catch {
        parsedOptions = [];
      }
    }

    return {
      ...q,
      options: parsedOptions
    };
  });

  questionsBankW = shuffleByTypeParts(normalized);

  console.log("Dữ liệu đã trộn theo Type:", questionsBankW);
  return questionsBankW;
 }

    return [];
  } catch (error) {
    console.error("Lỗi fetch questions:", error);
    return [];
  }
};
