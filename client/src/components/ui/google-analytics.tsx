import { useEffect } from "react";

interface GoogleAnalyticsProps {
	trackingId: string;
}

export function GoogleAnalytics({ trackingId }: GoogleAnalyticsProps) {
	useEffect(() => {
		if (!trackingId) return;
		// Load gtag script
		const script = document.createElement("script");
		script.src = `https://www.googletagmanager.com/gtag/js?id=${trackingId}`;
		script.async = true;
		document.head.appendChild(script);

		// Initialize dataLayer
		window.dataLayer = window.dataLayer || [];
		function gtag(...args: any[]) {
			window.dataLayer.push(args);
		}
		gtag("js", new Date());
		gtag("config", trackingId, { anonymize_ip: true });
	}, [trackingId]);

	return null;
}
