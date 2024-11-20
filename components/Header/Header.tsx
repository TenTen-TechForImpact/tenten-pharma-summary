// Header.tsx - 공통 헤더 컴포넌트
// 모든 페이지 상단에 표시되는 로고와 메인 링크

import React from "react";
import styles from "./Header.module.css";

const Header: React.FC = () => (
  <header className={`${styles.header} bg-white`}>
    <a href="/" className={"text-black text-3xl font-medium not-italic leading normal"}>
      TenTen
    </a>
  </header>
);

export default Header;
