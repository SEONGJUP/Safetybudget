import './globals.css';

export const metadata = {
  title: '산업안전보건관리비 | 예산관리 시스템',
  description: '산업안전보건법에 따른 안전관리비 예산수립, 집행실적 관리, 통계분석 시스템',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
