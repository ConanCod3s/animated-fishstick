function Chatbox({ tank, chat }) {
  const {
    message,
    setMessage,
    messages,
    setMessages,
    isSending,
    ticket,
    confirmationQuestion,
    setConfirmationQuestion,
    isConfirming,
    escalationError,
    setEscalationError,
    handleChatSubmit,
    confirmEscalation,
  } = chat;
  return (
    <div>
      <div className="chat-messages" aria-live="polite">
        {messages.length === 0 && (
          <p>Ask a question about {tank.name}'s tank!</p>
        )}
        {/* TODO: Render basic Markdown formatting such as **bold text**. */}
        {messages.map((chatMessage, index) => (
          <p key={`${chatMessage.sender}-${index}`}>
            <strong>{chatMessage.sender}:</strong> {chatMessage.text}
          </p>
        ))}
        {isSending && <p>AquaGuard is thinking...</p>}
      </div>
      {confirmationQuestion && !ticket && (
        <div
          className="escalation-confirmation"
          role="group"
          aria-label="Confirm human escalation"
        >
          <p>Do you want to escalate this issue to a human?</p>
          <button
            className="secondary-button"
            type="button"
            disabled={isConfirming}
            onClick={confirmEscalation}
          >
            {isConfirming ? "Creating ticket..." : "Yes, escalate"}
          </button>
          <button
            className="secondary-button"
            type="button"
            disabled={isConfirming}
            onClick={() => {
              setConfirmationQuestion("");
              setEscalationError("");
              setMessages((items) => [
                ...items,
                {
                  sender: "AquaGuard",
                  text: "Escalation cancelled. No ticket was created.",
                },
              ]);
            }}
          >
            No, continue chat
          </button>
        </div>
      )}
      {escalationError && <p role="alert">{escalationError}</p>}
      <form className="chat-form" onSubmit={handleChatSubmit}>
        <label htmlFor="chat-message">Message</label>
        <div className="chat-input-row">
          <input
            id="chat-message"
            name="message"
            placeholder="Hows the tank doing?"
            maxLength={2000}
            type="text"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
          />
        </div>
        <div className="chat-input-send-button">
          <button
            type="submit"
            disabled={!message.trim() || isSending || isConfirming}
          >
            {isSending ? "Sending..." : "Send"}
          </button>
        </div>
      </form>
    </div>
  );
}
export default Chatbox;
