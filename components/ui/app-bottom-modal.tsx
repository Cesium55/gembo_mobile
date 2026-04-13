import { BottomSheetBackdrop, BottomSheetModal, BottomSheetScrollView, BottomSheetView } from '@gorhom/bottom-sheet';
import { PropsWithChildren, useEffect, useMemo, useRef } from 'react';
import { StyleSheet, View } from 'react-native';

import { useAppTheme } from '@/providers/theme-provider';
import { AppText } from './app-text';

type AppBottomModalProps = PropsWithChildren<{
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  snapPoint?: `${number}%`;
  scrollable?: boolean;
}>;

export function AppBottomModal({ isOpen, onClose, title, snapPoint = '80%', scrollable = false, children }: AppBottomModalProps) {
  const { theme } = useAppTheme();
  const modalRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => [snapPoint], [snapPoint]);

  useEffect(() => {
    if (isOpen) {
      modalRef.current?.present();
      return;
    }

    modalRef.current?.dismiss();
  }, [isOpen]);

  return (
    <BottomSheetModal
      ref={modalRef}
      index={0}
      snapPoints={snapPoints}
      enableDynamicSizing={false}
      enableContentPanningGesture={!scrollable}
      onDismiss={onClose}
      enablePanDownToClose
      handleIndicatorStyle={[styles.indicator, { backgroundColor: theme.mutedTextColor }]}
      backgroundStyle={[styles.background, { backgroundColor: theme.cardColor }]}
      backdropComponent={(props) => <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} opacity={0.56} pressBehavior="close" />}>
      {scrollable ? (
        <>
          {title ? (
            <View style={[styles.header, { borderBottomColor: theme.borderColor }]}>
              <AppText style={[styles.title, { color: theme.textColor }]}>{title}</AppText>
            </View>
          ) : null}
          <BottomSheetScrollView
            style={styles.scrollBody}
            contentContainerStyle={styles.scrollBodyContent}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled">
            {children}
          </BottomSheetScrollView>
        </>
      ) : (
        <BottomSheetView style={styles.content}>
          {title ? (
            <View style={[styles.header, { borderBottomColor: theme.borderColor }]}>
              <AppText style={[styles.title, { color: theme.textColor }]}>{title}</AppText>
            </View>
          ) : null}
          <View style={styles.body}>{children}</View>
        </BottomSheetView>
      )}
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  background: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  body: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  scrollBody: {
    flex: 1,
  },
  scrollBodyContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
  },
  content: {
    flex: 1,
  },
  header: {
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingBottom: 10,
    paddingTop: 4,
  },
  indicator: {
    width: 48,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
  },
});
