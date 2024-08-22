import { Dialog, DialogPanel } from '@headlessui/react';
import { AnimatePresence, motion } from 'framer-motion';

export function AnimatedDialog({ isOpen, onRequestClose, children }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <Dialog
          static
          open={isOpen}
          onClose={() => onRequestClose(false)}
          className='relative z-50'
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className='fixed inset-0 bg-surface/50 backdrop-blur'
          />
          <div className='fixed inset-0 flex w-screen items-center justify-center'>
            <DialogPanel
              as={motion.div}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className='max-w-sm space-y-4 bg-surface rounded-lg ring-1 ring-border/50 shadow-xl text-uiText'
            >
              {children}
            </DialogPanel>
          </div>
        </Dialog>
      )}
    </AnimatePresence>
  );
}
