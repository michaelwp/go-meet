import React, { useEffect, useRef, useState } from "react";
import io, { Socket } from "socket.io-client";
import Peer, { SignalData } from "simple-peer";

const App: React.FC = () => {
    const [stream, setStream] = useState<MediaStream | undefined>(undefined);
    const [peer, setPeer] = useState<Peer.Instance | undefined>(undefined);
    const socket = useRef<Socket | undefined>(undefined);
    const userVideo = useRef<HTMLVideoElement>(null);
    const partnerVideo = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        socket.current = io("http://localhost:8080/ws");

        navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
            setStream(stream);
            if (userVideo.current) {
                userVideo.current.srcObject = stream;
            }
        });

        socket.current.on("signal", (data: SignalData) => {
            if (!peer) {
                const newPeer = new Peer({ initiator: false, trickle: false, stream: stream! });
                newPeer.signal(data);
                setPeer(newPeer);
            }
        });

        socket.current.on("connect", () => {
            if (!peer) {
                const newPeer = new Peer({ initiator: true, trickle: false, stream: stream! });
                setPeer(newPeer);
            }
        });

        return () => {
            socket.current?.disconnect();
        };
    }, [peer, stream]);

    useEffect(() => {
        if (peer) {
            peer.on("signal", (data) => {
                socket.current?.emit("signal", data);
            });

            peer.on("stream", (stream) => {
                if (partnerVideo.current) {
                    partnerVideo.current.srcObject = stream;
                }
            });
        }
    }, [peer]);

    return (
        <div>
            <video ref={userVideo} autoPlay muted />
            <video ref={partnerVideo} autoPlay />
        </div>
    );
};

export default App;
