import React, { useState, useEffect } from "react";
import MeetupForm from "../components/MeetupForm.jsx";
import { useNavigate } from "react-router-dom";

const CreateMeetup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: "",
    maxParticipants: "",
    deadline: { year: "", month: "", day: "" },
    meetupTime: { month: "", day: "", hour: "", minute: "" },
    images: [],
    location: "",
    latlng: null,
    description: "",
  });

  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("kakao_token");
    if (!token) {
      alert("로그인 정보가 없습니다. 메인 페이지로 이동합니다.");
      navigate("/"); // 또는 로그인 페이지로 이동
      return;
    }

    // 페이지 진입할 때마다 강제로 새로고침
    // 단, 새로고침 중 무한 루프 방지를 위해 리로드 체크 삽입
    const reloadKey = "forceReloaded_CreateMeetup";
    const hasReloaded = sessionStorage.getItem(reloadKey);

    if (!hasReloaded) {
      sessionStorage.setItem(reloadKey, "true");
      window.location.reload();
    } else {
      // 새로고침 이후에는 플래그 제거해서 다음 진입 때 다시 새로고침되도록 함
      sessionStorage.removeItem(reloadKey);
    }
  }, []);

  const BACKEND_API_URL = import.meta.env.VITE_BACKEND_API_URL;
  const token = localStorage.getItem("kakao_token");

  const handleChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleDeadlineChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      deadline: { ...prev.deadline, [field]: value },
    }));
  };

  const handleTimeChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      meetupTime: { ...prev.meetupTime, [field]: value },
    }));
  };

  const handleImageChange = (index, file) => {
    const updated = [...formData.images];
    updated[index] = file;
    setFormData((prev) => ({ ...prev, images: updated }));
  };

  const handleLocationSelect = ({ addressText, latlng }) => {
    console.log("📍 위치 선택됨:", addressText, latlng);
    setFormData((prev) => ({
      ...prev,
      location: addressText,
      latlng,
    }));
  };

  const isFormValid = () => {
    const {
      title,
      maxParticipants,
      deadline,
      meetupTime,
      latlng,
      description,
    } = formData;
    return (
      title.trim() &&
      maxParticipants.trim() &&
      deadline.year &&
      deadline.month &&
      deadline.day &&
      meetupTime.month &&
      meetupTime.day &&
      meetupTime.hour &&
      meetupTime.minute &&
      latlng &&
      description.trim()
    );
  };

  const handleSubmit = async (e) => {
    const token = localStorage.getItem("kakao_token");
    e.preventDefault();

    if (!isFormValid()) {
      alert("필수 요소가 모두 입력되지 않았습니다.");
      return;
    }

    const {
      title,
      maxParticipants,
      deadline,
      meetupTime,
      latlng,
      description,
      location,
    } = formData;

    const fullDeadline = `${deadline.year}-${deadline.month.padStart(
      2,
      "0"
    )}-${deadline.day.padStart(2, "0")}T00:00:00.000Z`;
    const fullMeetupTime = `2025-${meetupTime.month.padStart(
      2,
      "0"
    )}-${meetupTime.day.padStart(2, "0")}T${meetupTime.hour.padStart(
      2,
      "0"
    )}:${meetupTime.minute.padStart(2, "0")}:00.000Z`;

    const payload = {
      title,
      content: description,
      participantNumberMax: parseInt(maxParticipants),
      spotName: location,
      spotLongitude: latlng?.lng || 0,
      spotLatitude: latlng?.lat || 0,
      gatheringEndTime: fullDeadline,
      gatheringTime: fullMeetupTime,
      imageList: [], // 이미지 업로드 기능 연동 시 채움
    };

    console.log("📦 전송 payload:", payload);

    try {
      const res = await fetch(`${BACKEND_API_URL}/gathering/new`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`서버 오류: ${res.status}\n${errText}`);
      }

      alert("✅ 모임이 성공적으로 생성되었습니다!");
      navigate("/main");
    } catch (error) {
      console.error("❌ 모임 생성 중 오류:", error);
      alert("모임 생성 실패. 콘솔을 확인해주세요.");
    }
  };

  return (
    <div>
      <MeetupForm
        formData={formData}
        showMap={showMap}
        setShowMap={setShowMap}
        handleChange={handleChange}
        handleDeadlineChange={handleDeadlineChange}
        handleTimeChange={handleTimeChange}
        handleImageChange={handleImageChange}
        handleSubmit={handleSubmit}
        handleLocationSelect={handleLocationSelect}
      />
    </div>
  );
};

export default CreateMeetup;
