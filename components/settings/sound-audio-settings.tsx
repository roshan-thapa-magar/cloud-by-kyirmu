"use client";

import type React from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Volume2, Upload, RotateCcw } from "lucide-react";
import { toast } from "sonner";

interface NotificationSettings {
  clickSounds: boolean;
  notificationVolume: number;
  notificationSound: string;
  customSoundFile: File | null;
  clickSoundType: string;
  customClickSoundFile: File | null;
}

interface SoundAudioSettingsProps {
  notificationSettings: NotificationSettings;
  onNotificationChange: (
    setting: string,
    value: boolean | number | string | File | null
  ) => void;
  onResetSettings: () => void;
}

export function SoundAudioSettings({
  notificationSettings,
  onNotificationChange,
  onResetSettings,
}: SoundAudioSettingsProps) {
  const handleCustomSoundUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith("audio/")) {
        onNotificationChange("customSoundFile", file);
        onNotificationChange("notificationSound", "custom");
        toast.success("Custom Sound Uploaded", {
          description: `${file.name} has been set as your notification sound.`,
        });
      } else {
        toast.error("Invalid File Type", {
          description: "Please upload an audio file (MP3, WAV, etc.)",
        });
      }
    }
  };

  const handleCustomClickSoundUpload = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith("audio/")) {
        onNotificationChange("customClickSoundFile", file);
        onNotificationChange("clickSoundType", "custom");
        toast.success("Custom Click Sound Uploaded", {
          description: `${file.name} has been set as your click sound.`,
        });
      } else {
        toast.error("Invalid File Type", {
          description: "Please upload an audio file (MP3, WAV, etc.)",
        });
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sound & Audio Settings</CardTitle>
        <CardDescription>
          Configure audio feedback and notification sounds
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-base">Click Sounds</Label>
            <p className="text-sm text-muted-foreground">
              Play sounds for button clicks and interactions
            </p>
          </div>
          <Switch
            checked={notificationSettings.clickSounds}
            onCheckedChange={(checked) =>
              onNotificationChange("clickSounds", checked)
            }
          />
        </div>

        {notificationSettings.clickSounds && (
          <div className="space-y-2">
            <Label className="text-base">Click Sound Type</Label>
            <Select
              value={notificationSettings.clickSoundType}
              onValueChange={(value) =>
                onNotificationChange("clickSoundType", value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose click sound" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default Click</SelectItem>
                <SelectItem value="soft">Soft Click</SelectItem>
                <SelectItem value="sharp">Sharp Click</SelectItem>
                <SelectItem value="pop">Pop Sound</SelectItem>
                <SelectItem value="tap">Tap Sound</SelectItem>
                <SelectItem value="beep">Beep</SelectItem>
                <SelectItem value="custom">Custom Sound</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Choose from preset click sounds or upload your own custom sound
            </p>
          </div>
        )}

        {notificationSettings.clickSounds &&
          notificationSettings.clickSoundType === "custom" && (
            <div className="space-y-2">
              <Label htmlFor="custom-click-sound" className="text-base">
                Upload Custom Click Sound
              </Label>
              <div className="flex items-center gap-3">
                <Label htmlFor="custom-click-sound" className="cursor-pointer">
                  <div className="flex items-center space-x-2 bg-secondary hover:bg-secondary/80 px-4 py-2 rounded-md transition-colors">
                    <Upload className="h-4 w-4" />
                    <span>Choose Audio File</span>
                  </div>
                </Label>
                <Input
                  id="custom-click-sound"
                  type="file"
                  accept="audio/*"
                  className="hidden"
                  onChange={handleCustomClickSoundUpload}
                />
                {notificationSettings.customClickSoundFile && (
                  <span className="text-sm text-muted-foreground">
                    {notificationSettings.customClickSoundFile.name}
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Supported formats: MP3, WAV, OGG. Max size: 1MB. Short sounds
                work best for clicks.
              </p>
            </div>
          )}

        <div className="space-y-2">
          <Label className="text-base">Notification Sound</Label>
          <Select
            value={notificationSettings.notificationSound}
            onValueChange={(value) =>
              onNotificationChange("notificationSound", value)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Choose notification sound" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Default Notification</SelectItem>
              <SelectItem value="bell">Bell Sound</SelectItem>
              <SelectItem value="chime">Chime</SelectItem>
              <SelectItem value="ding">Ding</SelectItem>
              <SelectItem value="ping">Ping</SelectItem>
              <SelectItem value="pop">Pop</SelectItem>
              <SelectItem value="custom">Custom Sound</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">
            Choose from preset sounds or upload your own custom notification
            sound
          </p>
        </div>

        {notificationSettings.notificationSound === "custom" && (
          <div className="space-y-2">
            <Label htmlFor="custom-sound" className="text-base">
              Upload Custom Sound
            </Label>
            <div className="flex items-center gap-3">
              <Label htmlFor="custom-sound" className="cursor-pointer">
                <div className="flex items-center space-x-2 bg-secondary hover:bg-secondary/80 px-4 py-2 rounded-md transition-colors">
                  <Upload className="h-4 w-4" />
                  <span>Choose Audio File</span>
                </div>
              </Label>
              <Input
                id="custom-sound"
                type="file"
                accept="audio/*"
                className="hidden"
                onChange={handleCustomSoundUpload}
              />
              {notificationSettings.customSoundFile && (
                <span className="text-sm text-muted-foreground">
                  {notificationSettings.customSoundFile.name}
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Supported formats: MP3, WAV, OGG. Max size: 2MB
            </p>
          </div>
        )}

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-base">Notification Volume</Label>
            <span className="text-sm text-muted-foreground">
              {notificationSettings.notificationVolume}%
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Volume2 className="h-4 w-4 text-muted-foreground" />
            <input
              type="range"
              min="0"
              max="100"
              value={notificationSettings.notificationVolume}
              onChange={(e) =>
                onNotificationChange(
                  "notificationVolume",
                  Number.parseInt(e.target.value)
                )
              }
              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
            />
          </div>
        </div>

        <Button
          onClick={onResetSettings}
          variant="outline"
          className="w-full sm:w-auto bg-transparent"
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset to Default Settings
        </Button>
      </CardContent>
    </Card>
  );
}