import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import UserInfo from "../components/UserInfo";
import MapSection from "../components/MapSection";
import CreateButton from "../components/CreateButton";
import Loading from "../components/Loading";

function MainPage() {
  const { isLoggedIn } = useAuth();
  const token = localStorage.getItem("kakao_token");

  const [showAddressPrompt, setShowAddressPrompt] = useState(false);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingMap, setLoadingMap] = useState(true);

  const isLoading = isLoggedIn && (loadingUser || loadingMap);

  const handleAddressCheck = (hasAddress) => {
    if (!hasAddress) {
      setShowAddressPrompt(true);
    }
    console.log("✅ 사용자 주소 체크 완료");
    setLoadingUser(false);
  };

  const handleMapLoaded = () => {
    console.log("✅ 지도 로딩 완료");
    setLoadingMap(false);
  };

  useEffect(() => {
    if (!isLoggedIn) {
      setLoadingUser(false);
      setLoadingMap(false);
    }
  }, [isLoggedIn]);

  if (isLoading) {
    return (
      <div className="meeting-detail-wrapper">
        <div className="meeting-detail-container">
          <Loading overlay={true} />
        </div>
      </div>
    );
  }

  return (
    <div>
      {showAddressPrompt && (
        <div
          style={{
            backgroundColor: "#000000a0",
            color: "#fff",
            padding: "20px",
            textAlign: "center",
            position: "fixed",
            bottom: 0,
            left: 0,
            width: "100%",
            zIndex: 9999,
          }}
        >
          🚨 주소 정보가 없습니다. [프로필 → 주소 등록]을 먼저 완료해주세요.
        </div>
      )}

      {/* 로딩 중에는 UI 위에 오버레이로 로딩 띄움 */}
      {isLoading && <Loading overlay={true} />}

      <div style={{ padding: "40px", maxWidth: "1000px", margin: "0 auto", opacity: isLoading ? 0.5 : 1 }}>
        <h2>모임</h2>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
          }}
        >
          {token && <UserInfo onAddressCheck={handleAddressCheck} />}
          {isLoggedIn && <CreateButton />}
        </div>

        {/* 지도는 항상 렌더링 */}
        <MapSection onMapLoaded={handleMapLoaded} />
      </div>
    </div>
  );

}

export default MainPage;
