import { io } from "socket.io-client";
import config from "../src/config"
const socket = io(`http://13.200.129.119:3000`);

export default socket;
