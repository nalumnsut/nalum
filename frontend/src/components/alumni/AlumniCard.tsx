import { Badge } from "@/components/ui/badge";
import { GraduationCap, MapPin } from "lucide-react";
import UserAvatar from "@/components/UserAvatar";
import { ConnectionButton } from "@/components/ui/ConnectionButton";
import type { AlumniProfile } from "@/hooks/useAlumniDirectory";

interface AlumniCardProps {
  alumni: AlumniProfile;
  onConnect: (userId: string, message?: string) => void;
  onClick: () => void;
}

export const AlumniCard = ({ alumni, onConnect, onClick }: AlumniCardProps) => {
  return (
    <div
      onClick={onClick}
      // the overall container is flex-col,so in a row by h-full the height of all cards will be equal to height of largest sibling
      className="group rounded-xl border border-white/10 bg-white/5 backdrop-blur-md hover:bg-white/10 transition-all duration-300 cursor-pointer p-6 hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-500/10 hover:border-blue-500/30 flex flex-col h-full"
    >
      <div className="flex flex-col items-center text-center space-y-4 mb-6">
        <UserAvatar
          src={alumni.profile_picture}
          name={alumni.user.name}
          size="xl"
          className="ring-4 ring-white/5"
        />
        <div className="space-y-1 w-full overflow-hidden">
          <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors truncate max-w-full">
            {alumni.user.name}
          </h3>
          {(alumni.current_role || alumni.current_company) && (
            <p className="text-sm text-blue-400 font-medium line-clamp-2 break-words">
              {alumni.current_role}
              {alumni.current_role && alumni.current_company && " at "}
              {alumni.current_company}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-3 mb-6">
        {/* Academic Info */}
        <div className="flex flex-wrap items-center justify-center gap-2 text-sm text-gray-400">
          {alumni.batch && (
            <Badge variant="secondary" className="bg-white/5 hover:bg-white/10 border-white/10 text-gray-300">
              <GraduationCap className="h-3 w-3 mr-1" />
              {alumni.batch}
            </Badge>
          )}
          {alumni.branch && (
            <Badge variant="secondary" className="bg-white/5 hover:bg-white/10 border-white/10 text-gray-300">
              {alumni.branch}
            </Badge>
          )}
        </div>

        {alumni.campus && (
          <div className="flex items-center justify-center text-sm text-gray-500">
            <MapPin className="h-3 w-3 mr-1" />
            {alumni.campus}
          </div>
        )}
      </div>

      {/* Connection Button */}
      <div onClick={(e) => e.stopPropagation()} className="mt-auto pt-4">
        <ConnectionButton
          status={alumni.connectionStatus}
          userId={alumni.user._id}
          onConnect={onConnect}
          size="sm"
          fullWidth
          recipientName={alumni.user.name}
        />
      </div>
    </div>
  );
};
