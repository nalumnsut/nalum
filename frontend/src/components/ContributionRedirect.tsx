import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useContributionPopup } from "@/context/ContributionPopupContext";

interface ContributionRedirectProps {
  destination?: string;
}

export default function ContributionRedirect({
  destination = "/",
}: ContributionRedirectProps) {
  const navigate = useNavigate();
  const openContributionPopup = useContributionPopup();

  useEffect(() => {
    openContributionPopup();
    navigate(destination, { replace: true });
  }, [destination, navigate, openContributionPopup]);

  return null;
}
