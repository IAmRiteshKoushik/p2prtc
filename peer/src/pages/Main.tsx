import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Send } from "lucide-react"
import { useEffect, useState, useRef } from "react"
import { useNavigate } from "react-router-dom"

export function Main() {
  const [signal, setSignal] = useState<WebSocket | null>(null);
  const [sender, setSender] = useState<RTCPeerConnection | null>(null);
  const [receiver, setReceiver] = useState<RTCPeerConnection | null>(null);
  const navigate = useNavigate();

  // Reference to element
  const senderRef = useRef(null);
  const receiverRef = useRef(null);

  const setupSendingSocket = () => {
    const socket = new WebSocket("ws://localhost:8080/rtc");
    setSignal(socket);
    socket.onopen = () => {
      socket.send(JSON.stringify({
        type: "Sender"
      }));
    }
  }

  const getCameraAndStream = (pc: RTCPeerConnection) => {
    const video = senderRef.current;
    navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
      // @ts-ignore
      video.srcObject = stream;
      // @ts-ignore
      video.play();
      stream.getTracks().forEach((track) => {
        pc?.addTrack(track);
      });
    });
  }

  const initiateSender = async () => {
    if (!signal) {
      alert("Signalling server has not been found");
      return;
    }

    signal.onmessage = async (event: any) => {
      const message = JSON.parse(event.data);
      if (message.type === "createAnswer") {
        await sender!.setRemoteDescription(message.sdp);
      } else if (message.type === "iceCandidate") {
        sender?.addIceCandidate(message.iceCandidate);
      }
    }

    const newPC = new RTCPeerConnection();
    setSender(newPC);
    sender!.onicecandidate = (event: any) => {
      if (event.candidate) {
        signal?.send(JSON.stringify({
          type: "iceCandidate",
          candidate: event.candidate
        }));
      }
    }

    sender!.onnegotiationneeded = async () => {
      const offer = await sender!.createOffer();
      await sender!.setLocalDescription(offer);
      signal?.send(JSON.stringify({
        type: "createOffer",
        sdp: sender!.localDescription,
      }));
    }

    getCameraAndStream(sender!);
  }

  const setupReceivingSocket = () => {
    const socket = new WebSocket("ws://localhost:8080/rtc");
    socket.onopen = () => {
      socket.send(JSON.stringify({
        type: "Receiver",
      }));
    }
    startReceiving(socket);
  }

  const startReceiving = (socket: WebSocket) => {
    console.log("Receiving has started");
    const pc = new RTCPeerConnection();
    // Attaching event handlers
    pc.ontrack = (event) => {
      receiverRef.current.srcObject = new MediaStream([event.track]);
      receiverRef.play();
    }

    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === "createOffer") {
        pc.setRemoteDescription(message.sdp).then(() => {
          pc.createAnswer().then((answer) => {
            pc.setLocalDescription(answer);
            socket.send(JSON.stringify({
              type: "createAnswer",
              sdp: answer
            }));
          });
        });
      } else if (message.type === "iceCandidate") {
        pc.addIceCandidate(message.candidate);
      }
    }
  }

  return (
    <div className="w-screen h-screen">

      {/* AppBar */}
      <div className="w-screen px-5 py-2 flex bg-background">
        <div className="flex-1 text-3xl font-bold">Omegle</div>
        <div className="flex-none">
          <Button onClick={() => navigate("/")} >Logout</Button>
        </div>
      </div>

      {/* MainContent */}
      <div className="flex m-4 h-4/5">
        <div className="w-2/5">
          {/* Sending Footage */}
          <video ref={senderRef} id="sender" width="400" height="400" />
        </div>
        <div className="w-2/5">
          {/* Receiving Footage */}
          <video ref={receiverRef} id="receiver" width="400" height="400" />
        </div>
        <div className="w-1/5">
          <Tabs defaultValue="chat" className="h-4/5">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="chat">Chat</TabsTrigger>
              {/* <TabsTrigger value="files">Files</TabsTrigger> */}
            </TabsList>
            <TabsContent value="chat" className="h-full">
              <ChatScreen />
            </TabsContent>
            {/* <TabsContent value="files"> */}
            {/*   <FileScreen /> */}
            {/* </TabsContent> */}
          </Tabs>
        </div>
      </div>
    </div>
  );
}

interface VideoScreenProp {
  id: string
}

const VideoScreen = ({ id }: VideoScreenProp) => {
  return (
    <div className="w-full">
      <video id={id} className="w-full"></video>
    </div>
  );
}

const ChatScreen = () => {
  const [input, setInput] = useState<string>("");
  const [messages, setMessages] = useState<string[]>([]);
  const [ws, setWs] = useState<WebSocket | null>(null);

  useEffect(() => {
    const socket = new WebSocket("ws://localhost:8080/chat");

    // Implement event handlers
    socket.onopen = () => {
      // Send initial connection message
      socket.send(JSON.stringify({ type: "connect" }));
    };

    socket.onmessage = (event) => {
      const { content } = JSON.parse(event.data);
      console.log("Message : ", content);
      setMessages([...messages, content]);
      console.log(messages.length);
    }

    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    socket.onclose = () => {
      console.log("WebSocket closed");
    }

    setWs(socket);
    return () => {
      socket.close();
    }

  }, [])

  const handleSentMessage = () => {
    const msg = input.trim();
    if (ws && msg) {
      const message = { type: "send", content: msg };
      ws.send(JSON.stringify(message));
      setInput("");
    }
  }

  const renderMessage = () => {
    return messages.map((message: string, index: number) => (
      <div key={index}>
        <MessagePop content={message} />
      </div>
    ));
  }

  return (
    <div className="flex flex-col dark:bg-muted h-full w-full rounded-lg p-1">
      {/* Input Controls */}
      <div className="flex gap-x-2">
        <Input type="text" placeholder="Your message here"
          onChange={(e) => setInput(e.target.value)} value={input} />
        <Button onClick={handleSentMessage} size="icon">
          <Send />
        </Button>
      </div>

      {/* Messages */}
      <div>
        {renderMessage()}
      </div>

    </div>
  );
}


// TODO: Add a Sender field to identify who sent which message. (enchancement)
const MessagePop = ({ content }: { content: string }) => {
  return (
    <div className="flex flex-col gap-y-2 dark:bg-background my-1 rounded-md py-1 px-2">
      <div className="text-balance">{"> " + content}</div>
    </div>
  );
}

// const FileScreen = () => {
//   return (
//     <div className="dark:bg-muted h-full w-full rounded-lg">
//
//     </div>
//   );
// }
