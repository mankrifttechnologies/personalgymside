import { AbsoluteFill } from "remotion";
import { TransitionSeries, springTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { Scene1Intro } from "./scenes/Scene1Intro";
import { Scene2Problem } from "./scenes/Scene2Problem";
import { Scene3MemberFeatures } from "./scenes/Scene3MemberFeatures";
import { Scene4Social } from "./scenes/Scene4Social";
import { Scene5OwnerDashboard } from "./scenes/Scene5OwnerDashboard";
import { Scene6Analytics } from "./scenes/Scene6Analytics";
import { Scene7AI } from "./scenes/Scene7AI";
import { Scene8CTA } from "./scenes/Scene8CTA";
import { PersistentBackground } from "./components/PersistentBackground";

const T = springTiming({ config: { damping: 200 }, durationInFrames: 20 });

export const MainVideo = () => {
  return (
    <AbsoluteFill>
      <PersistentBackground />
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={105}>
          <Scene1Intro />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={T} />
        <TransitionSeries.Sequence durationInFrames={90}>
          <Scene2Problem />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={slide({ direction: "from-bottom" })} timing={T} />
        <TransitionSeries.Sequence durationInFrames={105}>
          <Scene3MemberFeatures />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={T} />
        <TransitionSeries.Sequence durationInFrames={100}>
          <Scene4Social />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={slide({ direction: "from-left" })} timing={T} />
        <TransitionSeries.Sequence durationInFrames={100}>
          <Scene5OwnerDashboard />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={T} />
        <TransitionSeries.Sequence durationInFrames={95}>
          <Scene6Analytics />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={slide({ direction: "from-right" })} timing={T} />
        <TransitionSeries.Sequence durationInFrames={95}>
          <Scene7AI />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={T} />
        <TransitionSeries.Sequence durationInFrames={120}>
          <Scene8CTA />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
