import { Scene } from './scene/Scene';
import { Hud } from './ui/Hud';
import { DotTooltip } from './ui/DotTooltip';
import { LoadingScreen } from './ui/LoadingScreen';

export default function App() {
  return (
    <div className="relative h-full w-full overflow-hidden">
      <Scene />
      <Hud />
      <DotTooltip />
      <LoadingScreen />
    </div>
  );
}
