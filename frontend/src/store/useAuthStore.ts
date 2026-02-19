import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { io, Socket } from "socket.io-client";

/* =========================
   Types
========================= */

interface User {
  _id: string;
  fullName: string;
  email: string;
  profilePic?: string;
}

interface SignupData {
  fullName: string;
  email: string;
  password: string;
}

interface AuthState {
  authUser: User | null;
  ischeckingAuth: boolean;
  isSigningUp: boolean;
  isLogginIn: boolean;
  socket: Socket | null;
  onlineUsers: string[];

  checkAuth: () => Promise<void>;
  signup: (data: SignupData) => Promise<void>;
  login: (data: { email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: { profilePic: string }) => Promise<void>;
  connectSocket: () => void;
  disconnectSocket: () => void;
}

/* =========================
   Base URL
========================= */

const BASE_URL =
  import.meta.env.MODE === "development" ? "http://localhost:5000" : "/";

/* =========================
   Store
========================= */

export const useAuthStore = create<AuthState>((set, get) => ({
  authUser: null,
  ischeckingAuth: true,
  isSigningUp: false,
  isLogginIn: false,
  socket: null,
  onlineUsers: [],

  /* =========================
     Auth Check
  ========================= */
  checkAuth: async () => {
    try {
      const res = await axiosInstance.get<User>("/auth/check");
      set({ authUser: res.data });
    } catch {
      set({ authUser: null });
    } finally {
      set({ ischeckingAuth: false });
    }
  },

  /* =========================
     Signup
  ========================= */
  signup: async (data) => {
    set({ isSigningUp: true });
    try {
      const res = await axiosInstance.post<User>("/auth/signup", data);
      set({ authUser: res.data });
      toast.success("Account created successfully");
      get().connectSocket();
    } catch {
      toast.error("Failed to create account");
    } finally {
      set({ isSigningUp: false });
    }
  },

  /* =========================
     Login
  ========================= */
  login: async ({ email, password }) => {
    set({ isLogginIn: true });
    try {
      const res = await axiosInstance.post<User>("/auth/login", {
        email,
        password,
      });

      set({ authUser: res.data });
      toast.success("Login successful");
      get().connectSocket();
    } catch {
      toast.error("Failed to login");
    } finally {
      set({ isLogginIn: false });
    }
  },

  /* =========================
     Logout
  ========================= */
  logout: async () => {
    try {
      await axiosInstance.post("/auth/logout");
      get().disconnectSocket();
      set({ authUser: null });
      toast.success("Logout successful");
    } catch {
      toast.error("Failed to logout");
    }
  },

  /* =========================
     Update Profile
  ========================= */
  updateProfile: async (data) => {
    try {
      const res = await axiosInstance.put<User>("/auth/update-profile", data);
      set({ authUser: res.data });
      toast.success("Profile updated successfully");
    } catch {
      toast.error("Failed to update profile");
    }
  },

  /* =========================
     Socket Connect
  ========================= */
  connectSocket: () => {
    const { authUser, socket } = get();

    if (!authUser || socket?.connected) return;

    const newSocket: Socket = io(BASE_URL, {
      withCredentials: true,
    });

    newSocket.connect();

    set({ socket: newSocket });

    newSocket.on("getOnlineUsers", (userIds: string[]) => {
      set({ onlineUsers: userIds });
    });
  },

  /* =========================
     Socket Disconnect
  ========================= */
  disconnectSocket: () => {
    const { socket } = get();
    if (socket?.connected) {
      socket.disconnect();
      set({ socket: null });
    }
  },
}));
