import { useEffect, useState } from "react";
import {
  X,
  ExternalLink,
  Mail,
  Phone,
  Building,
  MapPin,
  GraduationCap,
  Calendar,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import { useAdminApi } from "@/hooks/useAdminApi";
import { toast } from "sonner";

export interface VerificationQueueItem {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
    role: string;
    createdAt: string;
  };
  details_provided: {
    name: string;
    roll_no?: string;
    batch: string;
    branch: string;
  };
  contact_info?: {
    phone?: string;
    alternate_email?: string;
    linkedin?: string;
  };
  createdAt: string;
}

interface UserProfileData {
  batch?: string;
  branch?: string;
  campus?: string;
  bio?: string;
  current_company?: string;
  current_role?: string;
  location?: {
    city?: string;
    country?: string;
  };
  skills?: string[];
  profile_picture?: string;
}

interface VerificationDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: VerificationQueueItem | null;
  onApprove: (userId: string) => void;
  onReject: (item: VerificationQueueItem) => void;
  isActionLoading: boolean;
}

export const VerificationDetailsModal = ({
  isOpen,
  onClose,
  item,
  onApprove,
  onReject,
  isActionLoading,
}: VerificationDetailsModalProps) => {
  const adminApi = useAdminApi();
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  useEffect(() => {
    if (!isOpen || !item?.user?._id) {
      setProfile(null);
      return;
    }

    const fetchFullProfile = async () => {
      setIsLoadingProfile(true);
      try {
        const res = await adminApi.get<{ profile: UserProfileData }>(
          `/profile/user/${item.user._id}`,
        );
        setProfile(res.data.profile || null);
      } catch (err) {
        console.error(
          "Failed to load user profile in verification modal:",
          err,
        );
      } finally {
        setIsLoadingProfile(false);
      }
    };

    fetchFullProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, item]);

  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {item.user.name}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">{item.user.email}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Verification Submission Card */}
          <div className="bg-blue-50/70 border border-blue-100 rounded-lg p-4 space-y-3">
            <h3 className="text-sm font-semibold text-blue-900 flex items-center gap-2">
              <GraduationCap size={16} /> Provided Academic Credentials
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              <div>
                <span className="text-xs text-blue-700 font-medium block">
                  Provided Name
                </span>
                <span className="font-semibold text-gray-900">
                  {item.details_provided.name}
                </span>
              </div>
              <div>
                <span className="text-xs text-blue-700 font-medium block">
                  Batch
                </span>
                <span className="font-semibold text-gray-900">
                  {item.details_provided.batch}
                </span>
              </div>
              <div>
                <span className="text-xs text-blue-700 font-medium block">
                  Branch
                </span>
                <span className="font-semibold text-gray-900">
                  {item.details_provided.branch}
                </span>
              </div>
              <div>
                <span className="text-xs text-blue-700 font-medium block">
                  Roll Number
                </span>
                <span className="font-semibold text-gray-900">
                  {item.details_provided.roll_no || "N/A"}
                </span>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          {item.contact_info && (
            <div className="bg-gray-50 border border-gray-100 rounded-lg p-4 space-y-2">
              <h3 className="text-sm font-semibold text-gray-900">
                Contact Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                {item.contact_info.phone && (
                  <div className="flex items-center gap-2">
                    <Phone size={14} className="text-gray-400" />
                    <a
                      href={`tel:${item.contact_info.phone}`}
                      className="text-blue-600 hover:underline"
                    >
                      {item.contact_info.phone}
                    </a>
                  </div>
                )}
                {item.contact_info.alternate_email && (
                  <div className="flex items-center gap-2">
                    <Mail size={14} className="text-gray-400" />
                    <a
                      href={`mailto:${item.contact_info.alternate_email}`}
                      className="text-blue-600 hover:underline truncate"
                    >
                      {item.contact_info.alternate_email}
                    </a>
                  </div>
                )}
                {item.contact_info.linkedin && (
                  <div className="flex items-center gap-2">
                    <ExternalLink size={14} className="text-gray-400" />
                    <a
                      href={item.contact_info.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline font-medium"
                    >
                      LinkedIn Profile
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Registered User Profile Data */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Registered Profile Information
            </h3>
            {isLoadingProfile ? (
              <div className="flex items-center justify-center py-6 text-gray-500 gap-2">
                <Loader2 className="animate-spin" size={18} />
                <span className="text-sm">Fetching user profile data...</span>
              </div>
            ) : profile ? (
              <div className="space-y-3 bg-gray-50 border border-gray-100 rounded-lg p-4 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  {profile.current_company && (
                    <div className="flex items-center gap-2 text-gray-700">
                      <Building size={14} className="text-gray-400" />
                      <span>
                        {profile.current_role
                          ? `${profile.current_role} at `
                          : ""}
                        {profile.current_company}
                      </span>
                    </div>
                  )}
                  {profile.location &&
                    (profile.location.city || profile.location.country) && (
                      <div className="flex items-center gap-2 text-gray-700">
                        <MapPin size={14} className="text-gray-400" />
                        <span>
                          {[profile.location.city, profile.location.country]
                            .filter(Boolean)
                            .join(", ")}
                        </span>
                      </div>
                    )}
                  {profile.campus && (
                    <div className="flex items-center gap-2 text-gray-700">
                      <GraduationCap size={14} className="text-gray-400" />
                      <span>Campus: {profile.campus}</span>
                    </div>
                  )}
                </div>

                {profile.bio && (
                  <div className="pt-2 border-t border-gray-200">
                    <span className="text-xs font-semibold text-gray-500 block mb-1">
                      About / Bio
                    </span>
                    <p className="text-gray-700 text-sm whitespace-pre-wrap">
                      {profile.bio}
                    </p>
                  </div>
                )}

                {profile.skills && profile.skills.length > 0 && (
                  <div className="pt-2 border-t border-gray-200">
                    <span className="text-xs font-semibold text-gray-500 block mb-1">
                      Skills
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {profile.skills.map((skill, idx) => (
                        <span
                          key={idx}
                          className="bg-gray-200/70 text-gray-800 text-xs px-2.5 py-0.5 rounded-full font-medium"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-gray-500 italic">
                No additional profile details found for this user.
              </p>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 text-sm font-medium transition-colors"
          >
            Close
          </button>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                onClose();
                onReject(item);
              }}
              disabled={isActionLoading}
              className="flex items-center space-x-1.5 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 text-sm font-medium transition-colors"
            >
              <XCircle size={16} />
              <span>Reject</span>
            </button>
            <button
              onClick={() => {
                onClose();
                onApprove(item.user._id);
              }}
              disabled={isActionLoading}
              className="flex items-center space-x-1.5 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 text-sm font-medium transition-colors"
            >
              <CheckCircle size={16} />
              <span>Approve</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
