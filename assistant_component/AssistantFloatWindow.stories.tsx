import type { Meta, StoryObj } from "@storybook/react"
import React from "react"
import { AssistantFloatWindow } from "./AssistantFloatWindow"

const meta: Meta<typeof AssistantFloatWindow> = {
  title: "Assistant/AssistantFloatWindow",
  component: AssistantFloatWindow,
  args: {
    defaultOpen: true,
    title: "农业智能助手",
  },
}

export default meta

type Story = StoryObj<typeof AssistantFloatWindow>

export const Default: Story = {
  args: {
    onSend: async (message: string) => {
      await new Promise((r) => setTimeout(r, 100))
      return `收到：${message}`
    },
  },
}

export const DragResizeResetMinimize: Story = {
  args: {
    onSend: async (message: string) => {
      await new Promise((r) => setTimeout(r, 300))
      return `示例回复：${message}`
    },
  },
}

