import Chatbox from "./Chatbox";
import Ticketbox from "./Ticketbox";
import useAIChat from "./useAIChat";

function AIChat({ tank, currentUser }) {
  const chat = useAIChat({ tank, currentUser });
  const { activeTab, setActiveTab, ticket, ticketLoading, ticketError } = chat;
  return (
    <section className="panel chat-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">AI assistant</p>
          <h2>Ask AquaGuard AI</h2>
        </div>
      </div>
      <div
        className="assistant-tabs"
        role="tablist"
        aria-label="AI assistant"
        onKeyDown={(event) => {
          if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key))
            return;
          event.preventDefault();
          const nextTab =
            event.key === "Home"
              ? "chat"
              : event.key === "End"
                ? "ticket"
                : activeTab === "chat"
                  ? "ticket"
                  : "chat";
          setActiveTab(nextTab);
          event.currentTarget.querySelector(`#${nextTab}-tab`).focus();
        }}
      >
        <button
          id="chat-tab"
          role="tab"
          type="button"
          aria-selected={activeTab === "chat"}
          tabIndex={activeTab === "chat" ? 0 : -1}
          aria-controls="chat-panel"
          onClick={() => setActiveTab("chat")}
        >
          Chat
        </button>
        <button
          id="ticket-tab"
          role="tab"
          type="button"
          aria-selected={activeTab === "ticket"}
          tabIndex={activeTab === "ticket" ? 0 : -1}
          aria-controls="ticket-panel"
          onClick={() => setActiveTab("ticket")}
        >
          Tickets
        </button>
      </div>
      <div
        id="chat-panel"
        role="tabpanel"
        aria-labelledby="chat-tab"
        hidden={activeTab !== "chat"}
      >
        <Chatbox tank={tank} chat={chat} />
      </div>
      <div
        id="ticket-panel"
        role="tabpanel"
        aria-labelledby="ticket-tab"
        hidden={activeTab !== "ticket"}
      >
        <Ticketbox
          ticket={ticket}
          loading={ticketLoading}
          error={ticketError}
        />
      </div>
    </section>
  );
}
export default AIChat;
