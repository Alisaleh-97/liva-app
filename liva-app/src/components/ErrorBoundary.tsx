// Catches render errors so one bad component doesn't blank the entire app.
// When Sentry is configured (via EXPO_PUBLIC_SENTRY_DSN) the caught error is
// forwarded to it with the component stack as extra context.
import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { captureError } from '@/lib/errorReporting';

interface State { error: Error | null }

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State { return { error }; }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Fire-and-forget error report — errorReporting no-ops when unconfigured.
    captureError(error, { componentStack: info?.componentStack });
  }
  reset = () => this.setState({ error: null });

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <View style={{ flex: 1, backgroundColor: '#0D0A16', padding: 24, justifyContent: 'center' }}>
        <Text style={{ color: '#fff', fontSize: 22, fontWeight: '800', marginBottom: 8 }}>Something went wrong</Text>
        <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13, marginBottom: 18, lineHeight: 19 }}>
          A screen crashed. Tap "Try again" to recover — your data is safe.
        </Text>
        <ScrollView style={{ maxHeight: 140, marginBottom: 18 }}>
          <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontFamily: 'monospace' }}>
            {String(this.state.error?.message || this.state.error)}
          </Text>
        </ScrollView>
        <Pressable onPress={this.reset} style={{ paddingVertical: 14, borderRadius: 14, backgroundColor: '#8B5CF6', alignItems: 'center' }}>
          <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>Try again</Text>
        </Pressable>
      </View>
    );
  }
}
