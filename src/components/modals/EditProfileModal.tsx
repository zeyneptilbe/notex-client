import { useState, useEffect } from "react";
import { Modal } from "../common/Modal";
import { Input } from "../common/Input";
import { Button } from "../common/Button";
import { usersApi, type UpdateProfileRequest } from "../../api/users.api";
import { isForbiddenError } from "../../api/axios";

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    firstName: string;
    lastName: string;
    title?: string;
    bio?: string;
  };
  onSuccess: () => void;
}

export function EditProfileModal({
  isOpen,
  onClose,
  user,
  onSuccess,
}: EditProfileModalProps) {
  const [firstName, setFirstName] = useState(user.firstName);
  const [lastName, setLastName] = useState(user.lastName);
  const [title, setTitle] = useState(user.title || "");
  const [bio, setBio] = useState(user.bio || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // User değiştiğinde formu güncelle
  useEffect(() => {
    setFirstName(user.firstName);
    setLastName(user.lastName);
    setTitle(user.title || "");
    setBio(user.bio || "");
  }, [user]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!firstName.trim()) {
      newErrors.firstName = "Ad zorunludur";
    }

    if (!lastName.trim()) {
      newErrors.lastName = "Soyad zorunludur";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);

    try {
      const data: UpdateProfileRequest = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        title: title.trim() || undefined,
        bio: bio.trim() || undefined,
      };

      await usersApi.updateProfile(data);
      onSuccess();
      onClose();
    } catch (error) {
      if (!isForbiddenError(error)) {
        console.error("Profil güncelleme hatası:", error);
        setErrors({ submit: "Profil güncellenirken bir hata oluştu." });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Profili Düzenle">
      <form onSubmit={handleSubmit} className="space-y-4">
        {errors.submit && (
          <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">
            {errors.submit}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Ad"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            error={errors.firstName}
            disabled={isSubmitting}
          />
          <Input
            label="Soyad"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            error={errors.lastName}
            disabled={isSubmitting}
          />
        </div>

        <Input
          label="Ünvan"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Örn: Senior Developer"
          disabled={isSubmitting}
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Hakkımda
          </label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Kendinizden kısaca bahsedin..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows={4}
            disabled={isSubmitting}
          />
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isSubmitting}
          >
            İptal
          </Button>
          <Button type="submit" loading={isSubmitting}>
            Kaydet
          </Button>
        </div>
      </form>
    </Modal>
  );
}
