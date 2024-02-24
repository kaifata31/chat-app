import { useEffect, useState, useRef } from "react";
import Input from "../../Components/Input";
import Avatar from "../../assets/avatar.jpg";
import { io } from "socket.io-client";

const Dashboard = () => {
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("user:details"))
  );
  const [conversation, setConversation] = useState([]);
  const [messages, setMessages] = useState({});
  const [message, setMessage] = useState("");
  const [users, setUsers] = useState([]);
  const [socket, setSocket] = useState(null);
  const messageRef = useRef(null);
  console.log(messages);
  useEffect(() => {
    setSocket(io("http://localhost:8080"));
  }, []);

  useEffect(() => {
    socket?.emit("addUser", user?.id);
    socket?.on("getUsers", (users) => {
      console.log("activeUsers-->", users);
    });
    socket?.on("getMessage", (data) => {
      setMessages((prev) => ({
        ...prev,
        // messages: [...prev.messages, { user, message: data.message }],
        message: Array.isArray(prev.message)
          ? [...prev.message, { user: data.user, message: data.message }]
          : [{ user: data.user, message: data.message }],
      }));
    });
  }, [socket]);

  useEffect(() => {
    messageRef?.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages?.message]);

  useEffect(() => {
    const loggedInuser = JSON.parse(localStorage.getItem("user:details"));
    const fetchConversations = async () => {
      const res = await fetch(
        `http://localhost:8000/api/conversation/${loggedInuser?.id}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const resData = await res.json();

      setConversation(resData);
    };

    fetchConversations();
  }, []);

  useEffect(() => {
    const fetchUsers = async () => {
      const res = await fetch(`http://localhost:8000/api/users/${user?.id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const resData = await res.json();
      setUsers(resData);
    };

    fetchUsers();
  }, []);

  const fetchMessages = async (conversationId, reciever) => {
    const res = await fetch(
      `http://localhost:8000/api/message/${conversationId}?senderId=${user?.id}&&recieverId=${reciever?.recieverId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    const resData = await res.json();
    setMessages({ message: resData, reciever, conversationId });
  };

  const sendMessage = async (e) => {
    socket?.emit("sendMessage", {
      senderId: user?.id,
      recieverId: messages?.reciever?.recieverId,
      message,
      conversationId: messages?.conversationId,
    });
    const res = await fetch(`http://localhost:8000/api/message`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        conversationId: messages?.conversationId,
        senderId: user?.id,
        message,
        recieverId: messages?.reciever?.recieverId,
      }),
    });

    setMessage("");
  };

  return (
    <div className="w-[100%] flex min-h-screen relative">
      <div className="w-[25%]   h-screen bg-secondary overflow-scroll">
        <div className="flex  items-center mx-10 my-5">
          <img
            src={Avatar}
            width={75}
            height={75}
            alt="avatar"
            className="rounded-full"
          />
          <div className="ml-7">
            <h3 className="text-2xl font-semibold">{user?.fullName}</h3>
            <p className="text-lg">My Account</p>
          </div>
        </div>
        <hr />
        <div className="mx-8 mt-5">
          <div className="font-semibold text-primary text-lg">Messages</div>
          <div>
            {conversation.length > 0 ? (
              conversation.map(({ conversationId, user }) => {
                return (
                  <div
                    className="flex  items-center py-8 border-b border-b-gray-300"
                    // key={name}
                  >
                    <div
                      className="cursor-pointer flex items-center"
                      onClick={() => fetchMessages(conversationId, user)}
                    >
                      <img
                        src={Avatar}
                        width={60}
                        height={60}
                        alt="avatar"
                        className="rounded-full"
                      />
                      <div className="ml-7">
                        <h3 className="text-lg font-semibold">
                          {user?.fullName}
                        </h3>
                        <p className="text-sm text-gray-600">{user?.email}</p>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center text-lg font-semibold">
                No conversations
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="w-[50%]  h-screen bg-white flex flex-col items-center">
        {messages?.reciever?.fullName && (
          <div className="w-[75%] bg-secondary h-[70px] my-7 rounded-full">
            <div className=" mt-1 py-1 px-2 flex items-center gap-5">
              <img
                src={Avatar}
                width={55}
                height={55}
                alt="avatar"
                className="rounded-full cursor-pointer"
              />
              <div className="mr-auto">
                <h3 className="text-lg font-semibold">
                  {messages.reciever.fullName}
                </h3>
                <p className="text-sm font-light text-gray-600">
                  {messages.reciever.email}
                </p>
              </div>
              <div className="mr-4 cursor-pointer">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="icon icon-tabler icon-tabler-phone-outgoing"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  stroke-width="1.5"
                  stroke="#040404"
                  fill="none"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                  <path d="M5 4h4l2 5l-2.5 1.5a11 11 0 0 0 5 5l1.5 -2.5l5 2v4a2 2 0 0 1 -2 2a16 16 0 0 1 -15 -15a2 2 0 0 1 2 -2" />
                  <path d="M15 9l5 -5" />
                  <path d="M16 4l4 0l0 4" />
                </svg>
              </div>
            </div>
          </div>
        )}
        <div className="h-[75%]  w-full overflow-y-scroll shadow-sm ">
          <div className="p-10">
            {messages?.message?.length > 0 ? (
              messages.message.map(({ message, user: { id } = {} }) => {
                return (
                  <>
                    <div
                      className={`max-w-[40%] rounded-b-xl p-4 mb-6 ${
                        id === user?.id
                          ? `bg-primary text-white rounded-tl-xl ml-auto`
                          : `bg-secondary rounded-tr-xl`
                      }`}
                    >
                      {message}
                    </div>
                    <div ref={messageRef}></div>
                  </>
                );
              })
            ) : (
              <div className="text-center font-semibold text-lg mt-24">
                No Messages
              </div>
            )}
          </div>
        </div>

        <div className="p-10 w-full flex items-center">
          <Input
            placeholder="Type a message..."
            className="w-full"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            inputClassName="px-2 py-4 border-0 shadow-md bg-light rounded-lg outline-none"
          />
          <div
            className="ml-10 cursor-pointer p-4 mt-3 bg-light rounded-full"
            onClick={() => sendMessage()}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="icon icon-tabler icon-tabler-send"
              width="30"
              height="30"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="#2c3e50"
              fill="none"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path stroke="none" d="M0 0h24v24H0z" fill="none" />
              <path d="M10 14l11 -11" />
              <path d="M21 3l-6.5 18a.55 .55 0 0 1 -1 0l-3.5 -7l-7 -3.5a.55 .55 0 0 1 0 -1l18 -6.5" />
            </svg>
          </div>
          <div className="ml-10 cursor-pointer p-4 mt-3 bg-light rounded-full">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="icon icon-tabler icon-tabler-plus"
              width="30"
              height="30"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="#2c3e50"
              fill="none"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path stroke="none" d="M0 0h24v24H0z" fill="none" />
              <path d="M12 5l0 14" />
              <path d="M5 12l14 0" />
            </svg>
          </div>
        </div>
      </div>
      <div className="w-[25%]  h-screen bg-secondary px-4 py-10 overflow-scroll">
        <div className="font-semibold text-primary text-lg ">People</div>
        <div>
          {users.length > 0 ? (
            users.map(({ userId, user }) => {
              return (
                <div
                  className="flex  items-center py-8 border-b border-b-gray-300"
                  // key={name}
                >
                  <div
                    className="cursor-pointer flex items-center"
                    onClick={() => fetchMessages("new", user)}
                  >
                    <img
                      src={Avatar}
                      width={60}
                      height={60}
                      alt="avatar"
                      className="rounded-full"
                    />
                    <div className="ml-7">
                      <h3 className="text-lg font-semibold">
                        {user?.fullName}
                      </h3>
                      <p className="text-sm text-gray-600">{user?.email}</p>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center text-lg font-semibold">
              No conversations
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
