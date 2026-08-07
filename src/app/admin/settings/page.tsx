import { SettingsTabs } from "./SettingsTabs";
import { PlatformsPanel } from "./PlatformsPanel";
import { BossesPanel } from "./BossesPanel";
import { TaskTypesPanel } from "./TaskTypesPanel";

export default async function SettingsPage() {
  return (
    <SettingsTabs
      platformsPanel={<PlatformsPanel />}
      bossesPanel={<BossesPanel />}
      taskTypesPanel={<TaskTypesPanel />}
    />
  );
}
