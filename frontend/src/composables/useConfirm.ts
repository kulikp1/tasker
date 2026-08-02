import { reactive } from 'vue';

interface ConfirmOptions {
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
}

interface ConfirmState extends ConfirmOptions {
  visible: boolean;
  resolve: ((value: boolean) => void) | null;
}

export const confirmState: ConfirmState = reactive({
  visible: false,
  title: '',
  message: '',
  confirmText: 'Підтвердити',
  cancelText: 'Скасувати',
  danger: false,
  resolve: null,
});

export function useConfirm() {
  function confirm(options: ConfirmOptions): Promise<boolean> {
    confirmState.title = options.title;
    confirmState.message = options.message ?? '';
    confirmState.confirmText = options.confirmText ?? 'Підтвердити';
    confirmState.cancelText = options.cancelText ?? 'Скасувати';
    confirmState.danger = options.danger ?? false;
    confirmState.visible = true;
    return new Promise((resolve) => {
      confirmState.resolve = resolve;
    });
  }
  return { confirm };
}

export function resolveConfirm(value: boolean): void {
  confirmState.visible = false;
  confirmState.resolve?.(value);
  confirmState.resolve = null;
}
