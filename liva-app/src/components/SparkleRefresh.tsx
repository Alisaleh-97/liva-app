// Sparkle refresh — overlays a burst of stars/emoji at the top of a
// ScrollView when the user pulls to refresh. Purely decorative; pair with
// the RefreshControl on the underlying ScrollView.

import React, { useEffect, useRef } from 'react';
import { Animated, View, Text } from 'react-native';

interface Props { active: boolean }

const SPARKLES = ['✨', '⭐', '💫', '🌟', '✨'];

export function SparkleRefresh({ active }: Props) {
  const scale = useRef(new Animated.Value(0)).current;
  const rot = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (active) {
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 10 }),
        Animated.loop(Animated.timing(rot, { toValue: 1, duration: 2200, useNativeDriver: true })),
      ]).start();
    } else {
      Animated.spring(scale, { toValue: 0, useNativeDriver: true, speed: 30 }).start();
      rot.stopAnimation();
      rot.setValue(0);
    }
  }, [active, scale, rot]);

  const rotate = rot.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute', top: 32, alignSelf: 'center', left: 0, right: 0,
        alignItems: 'center', justifyContent: 'center',
        transform: [{ scale }],
        zIndex: 200,
      }}
    >
      <Animated.View style={{ transform: [{ rotate }], flexDirection: 'row', gap: 4 }}>
        {SPARKLES.map((s, i) => (
          <Text key={i} style={{ fontSize: 18 }}>{s}</Text>
        ))}
      </Animated.View>
    </Animated.View>
  );
}
