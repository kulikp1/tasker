import { toast as sonnerToast } from 'vue-sonner';

export const toast = {
  success(message: string): void {
    sonnerToast.success(message);
  },
  error(message: string): void {
    sonnerToast.error(message);
  },
  info(message: string): void {
    sonnerToast(message);
  },
};
