import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import "../css/meetingDetail.css";
import Loading from "../components/Loading";
import { formatDate, formatAddress, formatDateTime } from "../utils/format";

function MeetingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCreator, setIsCreator] = useState(false);
  const [maxParticipants, setMaxParticipants] = useState(10);
  const [statusClass, setStatusClass] = useState("");
  const [isEnrolled, setIsEnrolled] = useState(false);
  const BACKEND_API_URL = import.meta.env.VITE_BACKEND_API_URL;

  useEffect(() => {
    const fetchMeetingDetail = async () => {
      const token = localStorage.getItem("kakao_token");
      if (!token) {
        setError("로그인이 필요합니다.");
        navigate("/login");
        return;
      }

      setLoading(true);
      try {
        // 모임 상세 정보 가져오기
        const response = await fetch(`${BACKEND_API_URL}/gathering/${id}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            localStorage.removeItem("kakao_token");
            setError("로그인이 만료되었습니다. 다시 로그인해주세요.");
            navigate("/login");
            return;
          }
          throw new Error("모임 정보를 불러오는데 실패했습니다.");
        }

        const data = await response.json();
        console.log(data);
        setMeeting(data);
        setMaxParticipants(data.participantMaxNumber);
        setIsCreator(data.isAuthor);
        setStatusClass(
          data.gatheringStatus === "GATHERING_CONFIRMED"
            ? "closed"
            : data.gatheringStatus === "GATHERING_PENDING"
            ? "hold"
            : ""
        );

        try {
          // 현재 사용자의 정보 가져오기
          const userResponse = await fetch(`${BACKEND_API_URL}/member/me`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (userResponse.ok) {
            const userData = await userResponse.json();
            // pendingPosts 배열에서 현재 모임의 postId가 있는지 확인
            const isUserEnrolled = userData.pendingPosts.some(
              (post) => post.postId === parseInt(id)
            );
            setIsEnrolled(isUserEnrolled);
          }
        } catch (enrolledError) {
          console.error(
            "사용자 정보를 가져오는데 실패했습니다:",
            enrolledError
          );
          setIsEnrolled(false);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMeetingDetail();
  }, [id, navigate, BACKEND_API_URL]);

  if (error) return <div className="error">{error}</div>;

  const handleJoinMeeting = async () => {
    if (!meeting) return;
    const token = localStorage.getItem("kakao_token");
    setLoading(true);

    try {
      // 주소가 있는 경우에만 참가 신청 진행
      const response = await fetch(`${BACKEND_API_URL}/enroll/${id}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          postId: id,
          gatheringStatus: meeting.gatheringStatus,
        }),
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem("kakao_token");
          alert("로그인이 만료되었습니다. 다시 로그인해주세요.");
          navigate("/login");
          return;
        }
        throw new Error("모임 참가 신청에 실패했습니다.");
      }

      alert("모임 참가 신청이 완료되었습니다!");
      // 모임 정보 새로고침을 위해 현재 페이지를 다시 로드
      window.location.reload();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMeeting = async () => {
    if (!meeting) return;
    const token = localStorage.getItem("kakao_token");

    try {
      const response = await fetch(`${BACKEND_API_URL}/gathering/delete`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          postId: meeting.postId,
        }),
      });

      if (!response.ok) {
        throw new Error("모임 취소에 실패했습니다.");
      }

      alert("모임 취소가 완료되었습니다.");
      navigate("/mypage"); // 모임 취소 후 마이페이지로 이동
    } catch (err) {
      alert(err.message);
    }
  };

  const handleChangeMaxParticipants = async () => {
    if (!meeting) return;
    const token = localStorage.getItem("kakao_token");
    setLoading(true);

    try {
      const response = await fetch(`${BACKEND_API_URL}/gathering/update`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          postId: meeting.postId,
          participantMaxNumber: maxParticipants,
          imageList: meeting.imageList,
        }),
      });

      if (!response.ok) {
        throw new Error("인원 변경에 실패했습니다.");
      }

      alert("인원 변경이 완료되었습니다.");
      // 모임 정보 새로고침
      const updatedResponse = await fetch(
        `${BACKEND_API_URL}/gathering/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (updatedResponse.ok) {
        const updatedData = await updatedResponse.json();
        setMeeting(updatedData);
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };
  if (loading) {
    return (
      <div className="meeting-detail-wrapper">
        <div className="meeting-detail-container">
          <Loading overlay={true} />
        </div>
      </div>
    );
  }

  return (
    <div className="meeting-detail-wrapper">
      <div className="meeting-detail-container">
        <h1 className="meeting-title sb-24">{meeting.title}</h1>
        <main className="meeting-content">
          {/* 상태 뱃지 */}
          <div className={`meeting-status ${statusClass} rg-12`}>
            {meeting.gatheringStatus === "GATHERING_CONFIRMED" ||
            meeting.gatheringStatus === "FINISHED"
              ? "모집 완료"
              : meeting.gatheringStatus === "GATHERING_PENDING"
              ? "모집 마감 보류"
              : "모집 중"}
          </div>
          {/* 상세 정보 */}
          <div className="meeting-info">
            {!isCreator && (
              <div className="info-item">
                <span className="label rg-14">생성자: </span>
                <span className="value sb-14">{meeting.leadUserNickname}</span>
              </div>
            )}
            <div className="info-item">
              <span className="label rg-14">참여 인원</span>
              <span className="value sb-14">
                {meeting.enrolledCount}/ {meeting.participantMaxNumber}명
              </span>
            </div>

            {/* 모임 생성자인 경우에만 인원 변경 버튼 표시 */}
            {isCreator && meeting.gatheringStatus !== "GATHERING_CONFIRMED" && (
              <div className="info-item">
                <div className="max-participants-control">
                  <input
                    type="range"
                    min={meeting.currentParticipants ?? 1}
                    max={10}
                    value={maxParticipants}
                    onChange={(e) => setMaxParticipants(Number(e.target.value))}
                    className="max-participants-range"
                  />
                  <span className="max-participants-value sb-14">
                    {maxParticipants}명
                  </span>
                  <button
                    className="change-max-btn"
                    onClick={handleChangeMaxParticipants}
                  >
                    <span className="sb-14">인원 변경</span>
                  </button>
                </div>
              </div>
            )}
            {meeting.gatheringStatus !== "GATHERING_CONFIRMED" && (
              <div className="info-item">
                <span className="label rg-14">모집 기간</span>
                <span className="value sb-14">
                  {formatDate(meeting.gatheringEndTime)}
                </span>
              </div>
            )}
            <div className="info-item">
              <span className="label rg-14">모임 장소</span>
              <span className="value sb-14">
                {formatAddress(meeting.address)}
              </span>
            </div>
            <div className="info-item">
              <span className="label rg-14">모임 시간</span>
              <span className="value sb-14">
                {formatDateTime(meeting.gatheringTime)}
              </span>
            </div>
          </div>
          <div className="meeting-description">
            <p className="rg-14">
              {meeting.content || "모임 설명이 없습니다."}
            </p>
          </div>
          {/* 모임 생성자가 아니고, 아직 신청하지 않은 경우에만 참여하기 버튼 표시 */}
          {!isCreator &&
            !isEnrolled &&
            meeting.gatheringStatus === "GATHERING" && (
              <button className="join-meeting-btn" onClick={handleJoinMeeting}>
                <span className="sb-14">신청하기</span>
              </button>
            )}
          {isCreator && meeting.gatheringStatus !== "GATHERING_CONFIRMED" && (
            <div>
              <button
                className="delete-meeting-btn"
                onClick={handleDeleteMeeting}
              >
                <span className="sb-14">모임 취소</span>
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default MeetingDetail;
