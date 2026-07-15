/** Now wrapping the correct CreatePostModal */
import CreatePostModal from "@/components/posts/CreatePostModal";

interface AdminCreatePostModalProps {
  open: boolean;
  onClose: () => void;
  onPostCreated?: () => void;
}

const AdminCreatePostModal = ({
  open,
  onClose,
  onPostCreated,
}: AdminCreatePostModalProps) => (
  <CreatePostModal 
    open={open} 
    onClose={onClose} 
    onPostCreated={onPostCreated} 
  />
);

export default AdminCreatePostModal;