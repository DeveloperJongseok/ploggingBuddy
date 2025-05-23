//OauthCallbackKakao.jsx

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

function OauthCallbackKakao() {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URL(window.location.href).searchParams;
    const token = params.get("code");

    if (token) {
      localStorage.setItem("kakao_token", token);
      // 홈으로 리다이렉트
      navigate("/");
    } else {
      // 토큰이 없을 때 예외 처리(에러 페이지 등)
      alert("로그인 토큰이 없습니다.");
      navigate("/");
    }
  }, [navigate]);

  return <div>로그인 처리 중...</div>;
}

export default OauthCallbackKakao;
