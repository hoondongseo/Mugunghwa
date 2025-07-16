import React, { createContext, useContext, useState, ReactNode } from "react";
import type { Message as MessageType } from "@shared/schema";

interface LikesContextValue {
	likedIds: Set<number>;
	toggleLike: (id: number) => void;
}

const LikesContext = createContext<LikesContextValue | undefined>(undefined);

export function LikesProvider({ children }: { children: ReactNode }) {
	const [likedIds, setLikedIds] = useState<Set<number>>(new Set());

	const toggleLike = (id: number) => {
		setLikedIds((prev) => {
			const s = new Set(prev);
			if (s.has(id)) s.delete(id);
			else s.add(id);
			return s;
		});
	};

	return (
		<LikesContext.Provider value={{ likedIds, toggleLike }}>
			{children}
		</LikesContext.Provider>
	);
}

export function useLikes() {
	const context = useContext(LikesContext);
	if (!context) {
		throw new Error("useLikes must be used within a LikesProvider");
	}
	return context;
}
