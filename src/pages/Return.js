import { loadTossPayments } from "@tosspayments/payment-sdk";
import { Html5QrcodeScanner } from "html5-qrcode";
import { useState, useEffect } from "react";

const Return = () => {
  const [data, setData] = useState("None");
  const [message, setMessage] = useState(""); // 나중에 ""으로 변경, 항시 읽음은 true
  const [extraFee, setExtraFee] = useState(0); // 추가요금 상태 추가
  const [isUmbrellaAvailable, setIsUmbrellaAvailable] = useState(true); // 우산 유무 상태 추가
  const [isScanning, setIsScanning] = useState(false); // 스캐닝 상태 추가
  let scanner; // 스캐너 인스턴스를 전역 변수로 선언

  // 토큰 디버깅용 콘솔 로그
  useEffect(() => {
    const token = localStorage.getItem("token");
    console.log("현재 저장된 토큰:", token);
    console.log("토큰이 있나요?", !!token);
  }, []);

  //결제 버튼 누를시 toss 페이먼츠로 이동
  const handleClick = async () => {
    //const uniqueId = "123";
    const orderId = `order-${Date.now()}`;

    const CLIENT_KEY = process.env.REACT_APP_TOSS_CLIENT_KEY;
    console.log("CLIENT_KEY:", CLIENT_KEY);

    try {
      const tossPayments = await loadTossPayments(
        process.env.REACT_APP_TOSS_CLIENT_KEY
      );

      await tossPayments.requestPayment("카드", {
        amount: `${extraFee}`, //가격도 하드코딩 말고 컨포넌트로 넣을 예정정
        orderId: orderId,
        orderName: `${data}번 우산 반납 추가 요금`, // 나중에 몇번 우산 넣을 곳
        //customerName: "고객님",
        //customerEmail: "customer@example.com",
        successUrl: `${window.location.origin}/payments/complete`,
        failUrl: `${window.location.origin}/payments/fail`,
      });
    } catch (error) {
      console.error("결제 요청 중 오류:", error);
    }
  };

  // QR 코드 스캔 성공 시 처리 로직
  const handleScanSuccess = (decodedText) => {
    console.log("QR 코드 스캔 성공:", decodedText);
    setData(decodedText);

    const token = localStorage.getItem("token");
    fetch("/api/return", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ seat: decodedText, paid: false }),
    })
      .then((res) => res.json())
      .then((resData) => {
        // 우산이 있는 경우 반납 요청 실패 처리
        if (resData.message === "해당 자리에 우산이 있습니다.") {
          setMessage(resData.message);
          setIsUmbrellaAvailable(false); // 우산이 있는 상태로 설정
          setExtraFee(0); // 추가 요금 초기화
        } else {
          setMessage(resData.message || "반납 요청 성공!");
          setExtraFee(resData.extraFee || 0); // 추가요금 상태 업데이트
          setIsUmbrellaAvailable(true); // 우산 유무 상태 업데이트
        }
        stopScanner(); // 스캔 성공 후 스캐너 정리
      })
      .catch((error) => {
        console.error("반납 요청 실패:", error);
        setMessage("반납 요청 중 오류 발생");
      });
  };

  const startScanner = () => {
    if (scanner) {
      scanner.clear(); // 이전 스캐너 정리
    }
    scanner = new Html5QrcodeScanner("qr-reader", {
      fps: 10,
      qrbox: { width: 250, height: 250 },
    });

    scanner.render(handleScanSuccess, (error) => {
      console.error("QR 코드 스캔 오류:", error);
    });
    setIsScanning(true); // 스캐닝 상태 업데이트
  };

  const stopScanner = () => {
    if (scanner) {
      scanner.clear(); // 스캐너 정리
    }
    setIsScanning(false); // 스캐닝 상태 업데이트
  };

  useEffect(() => {
    startScanner(); // 컴포넌트가 마운트될 때 스캐너 시작

    return () => {
      stopScanner(); // 컴포넌트 언마운트 시 스캐너 정리
    };
  }, []);

  return (
    <div className="container">
      <h2>우산 반납</h2>
      <div id="qr-reader" style={{ width: "100%" }}></div>

      {message && (
        <div>
          <p>스캔된 자리 번호: {data}</p>
          <p>{message}</p>

          {isUmbrellaAvailable ? (
            extraFee > 0 ? (
              <>
                <p style={{ color: "red", fontWeight: "bold" }}>
                  추가요금 {extraFee}원이 있습니다.
                </p>
                <p>결제하시겠습니까?</p>
                <button onClick={handleClick}>추가 결제 진행하기</button>
              </>
            ) : (
              <p style={{ color: "green" }}>추가요금이 없습니다. 반납 완료!</p>
            )
          ) : (
            <button
              onClick={() => {
                setData("None"); // QR 코드 데이터 초기화
                setMessage(""); // 메시지 초기화
                stopScanner(); // QR 코드 스캐너 정리
                startScanner(); // 새로운 스캐너 시작
              }}
            >
              QR 다시 찍기
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default Return;
