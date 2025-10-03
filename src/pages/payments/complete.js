import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";

const Paymentsuccess = () => {
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const fetchPaymentDetails = async () => {
      try {
        const paymentKey = searchParams.get("paymentKey");
        const orderId = searchParams.get("orderId");
        const amount = searchParams.get("amount");

        console.log("결제 정보:", { paymentKey, orderId, amount });

        if (!paymentKey || !orderId || !amount) {
          throw new Error("필수 결제 정보가 누락되었습니다.");
        }

        const secretKey = process.env.REACT_APP_TOSS_SECRET_KEY;
        // Buffer.from 대신 btoa 사용
        const basicToken = btoa(`${secretKey}:`);

        const response = await fetch(
          "https://api.tosspayments.com/v1/payments/confirm",
          {
            method: "POST",
            headers: {
              Authorization: `Basic ${basicToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              paymentKey,
              orderId,
              amount: Number(amount),
            }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.message || "결제 승인 중 오류가 발생했습니다."
          );
        }

        const data = await response.json();
        console.log("결제 승인 결과:", data);
        setPaymentDetails(data);

        const isReturnPayment = data.orderName.includes("반납");
        const isRentPayment = data.orderName.includes("대여");
        const isDamagePayment = data.orderName.includes("파손/분실");

        // ✅ [추가] 서버로 모터 작동 요청
        if (isRentPayment) {
          const token = localStorage.getItem("token");
          const seat = data.orderName.split("번")[0]; // "2-3번 우산 대여" → "2-3"
          const motorRes = await fetch("/api/rent", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              seat,
              orderId,
              amount,
              paid: true,
            }),
          });

          const motorData = await motorRes.json();
          console.log("서버 응답:", motorData);
        }

        if (isReturnPayment) {
          // ✅ seat 정보는 orderName에서 추출
          const seat = data.orderName.split("번")[0]; // 예: "2-3번 우산 반납 추가 요금"

          // 추가요금 결제일 경우 → 반납 완료 처리
          if (data.orderName.includes("추가 요금")) {
            const token = localStorage.getItem("token");

            const motorRes = await fetch("/api/return", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                seat,
                orderId,
                amount,
                paid: true, // ✅ 결제 완료 상태 전달
              }),
            });

            const motorData = await motorRes.json();
            console.log("반납 모터 작동 결과:", motorData);
          }
        }

        if (isDamagePayment) {
          const token = localStorage.getItem("token");

          const res = await fetch("/api/return/damage", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              orderId,
              amount,
            }),
          });

          const data = await res.json();
          console.log("파손/분실 처리 결과:", data);
        }
      } catch (err) {
        console.error("결제 처리 중 오류:", err);
        setError(err.message || "결제 정보를 불러오는 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentDetails();
  }, [searchParams]);

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "20px" }}>
        <h2>결제 정보를 처리하는 중...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: "center", padding: "20px", color: "red" }}>
        <h2>오류 발생</h2>
        <p>{error}</p>
        <p>주문 ID: {searchParams.get("orderId")}</p>
        <p>결제 금액: {searchParams.get("amount")}원</p>
      </div>
    );
  }

  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <h2>결제가 완료되었습니다!</h2>
      {paymentDetails && (
        <div>
          <p>주문 ID: {paymentDetails.orderId}</p>
          <p>주문명: {paymentDetails.orderName}</p>
          <p>결제 금액: {paymentDetails.totalAmount}원</p>
          <p>
            결제 시간: {new Date(paymentDetails.approvedAt).toLocaleString()}
          </p>
        </div>
      )}
    </div>
  );
};

export default Paymentsuccess;
