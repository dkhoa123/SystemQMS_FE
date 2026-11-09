import axios from "axios";

export const axiosClient = axios.create({
  baseURL: "https://localhost:7058/api",
  headers: {
    "Content-Type": "application/json",
  },
});
