import { useEffect, useRef, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../../../firebase/Config";
import { AI_WORKER_URL } from "../../../utils/constants";

function useAIChat({ tank, currentUser }) {
  const [supportTicket, setSupportTicket] = useState(null);
  const [ticketLoading, setTicketLoading] = useState(true);
  const [ticketError, setTicketError] = useState("");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const [activeTab, setActiveTab] = useState("chat");
  const [createdTicket, setCreatedTicket] = useState(null);
  const [confirmationQuestion, setConfirmationQuestion] = useState("");
  const [isConfirming, setIsConfirming] = useState(false);
  const [escalationError, setEscalationError] = useState("");
  const confirmationInProgress = useRef(false);
  const ticket = supportTicket || createdTicket;

  const isOwner = currentUser.uid === tank.ownerId;

  useEffect(() => {
    // Read only this tank's ticket while its detail page is open.
    return onSnapshot(
      doc(db, "supportTickets", tank.id),
      (snapshot) => {
        setSupportTicket(
          snapshot.exists() ? { ...snapshot.data(), id: snapshot.id } : null,
        );
        setTicketLoading(false);
        setTicketError("");
      },
      () => {
        setTicketLoading(false);
        setTicketError("This tank's ticket could not be loaded.");
      },
    );
  }, [tank.id]);
  async function handleChatSubmit(event) {
    event.preventDefault();

    const trimmedMessage = message.trim();

    if (!trimmedMessage || isSending) {
      return;
    }

    setMessages((currentMessages) => [
      ...currentMessages,
      { sender: "You", text: trimmedMessage },
    ]);
    setMessage("");
    setIsSending(true);
    setConfirmationQuestion("");
    setEscalationError("");

    try {
      const token = await currentUser.getIdToken();
      const response = await fetch(`${AI_WORKER_URL}/chat`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: trimmedMessage,
          tank: {
            id: tank.id,
            name: tank.name,
            type: tank.type,
            gallons: tank.gallons,
            status: tank.status,
            temperature: tank.temperature,
            ph: tank.ph,
            ammonia: tank.ammonia,
          },
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "AquaGuard could not answer.");
      }

      setMessages((currentMessages) => [
        ...currentMessages,
        { sender: "AquaGuard", text: data.response },
      ]);
      if (data.ticket) {
        setCreatedTicket(data.ticket);
        setMessages((items) => [
          ...items,
          {
            sender: "AquaGuard",
            text: data.created
              ? "This issue has been escalated for human review. See the Ticket tab."
              : "This tank already has a support ticket. See the Ticket tab.",
          },
        ]);
      } else if (data.confirmationRequired && !ticket && isOwner) {
        setConfirmationQuestion(data.escalationQuestion || trimmedMessage);
      }
      if (data.escalationError) setEscalationError(data.escalationError);
      if (data.escalationUnavailable)
        setEscalationError("Only the tank owner can escalate this issue.");
    } catch (error) {
      setMessages((currentMessages) => [
        ...currentMessages,
        { sender: "AquaGuard", text: error.message },
      ]);
    } finally {
      setIsSending(false);
    }
  }

  async function confirmEscalation() {
    if (
      !confirmationQuestion ||
      confirmationInProgress.current ||
      ticket ||
      !isOwner
    )
      return;
    confirmationInProgress.current = true;
    setIsConfirming(true);
    setEscalationError("");
    try {
      const token = await currentUser.getIdToken();
      const response = await fetch(`${AI_WORKER_URL}/tickets/confirm`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: confirmationQuestion,
          tank: { id: tank.id },
          confirmEscalation: true,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.ticket)
        throw new Error(
          data.error || "Could not create a ticket.",
        );
      setCreatedTicket(data.ticket);
      setConfirmationQuestion("");
      setMessages((items) => [
        ...items,
        { sender: "AquaGuard", text: data.response },
      ]);
      setActiveTab("ticket");
    } catch (error) {
      setEscalationError(error.message);
    } finally {
      confirmationInProgress.current = false;
      setIsConfirming(false);
    }
  }

  return {
    message,
    setMessage,
    messages,
    setMessages,
    isSending,
    activeTab,
    setActiveTab,
    ticket,
    ticketLoading,
    ticketError,
    confirmationQuestion,
    setConfirmationQuestion,
    isConfirming,
    escalationError,
    setEscalationError,
    handleChatSubmit,
    confirmEscalation,
  };
}
export default useAIChat;
