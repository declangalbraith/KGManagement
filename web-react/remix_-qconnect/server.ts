import express from "express";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import path from "path";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes
  app.post("/api/chat", async (req, res) => {
    try {
      const { messages, context, references } = req.body;
      
      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: "Invalid messages format" });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      
      if (!apiKey) {
        // Fallback mock response if no API key is provided
        console.log("No GEMINI_API_KEY found. Using mock response.");
        const lastMessage = messages[messages.length - 1].content.toLowerCase();
        let mockResponse = "为了获得真实的智能回复，请在环境变量中配置 `GEMINI_API_KEY`。";
        
        if (lastMessage.includes("踏面剥离")) {
          mockResponse = "### CRH380 车轮踏面剥离分析\n\n**故障原因分析：**\n1. **材质疲劳**：车轮长期在高速重载下运行，踏面表层金属产生疲劳微裂纹。\n2. **制动热应力**：频繁的紧急制动导致踏面局部温度急剧升高，随后快速冷却，产生热裂纹。\n3. **轮轨接触不良**：轨道不平顺或车轮踏面外形磨耗超限，导致接触应力集中。\n\n**历史案例检索：**\n- **案例编号 ISS-202305-042**：某局 CRH380A 动车组在运行 150 万公里后出现集中性踏面剥离，经查为该批次车轮材质碳含量偏高导致韧性不足。\n- **案例编号 ISS-202401-088**：冬季高寒地区运行的 CRH380B 频繁出现剥离，与冰雪天气下制动频繁及轮轨粘着系数降低有关。\n\n**推荐处置方案：**\n1. **立即执行**：对剥离长度超过 20mm 或深度超过 1mm 的车轮进行旋修作业。\n2. **短期预防**：加强对同批次车轮的超声波探伤频次，重点关注轮辋内部缺陷。\n3. **长期改善**：建议优化制动控制逻辑，减少单次高强度制动，并联合供应商评估车轮材质改进方案。";
        } else if (lastMessage.includes("温度过高")) {
          mockResponse = "### 转向架轴承温度过高报警分析\n\n**可能原因：**\n1. **润滑不良**：润滑脂变质、流失或加注量不足。\n2. **装配问题**：轴承游隙过小或过大，密封圈安装不当导致摩擦发热。\n3. **机械损伤**：滚子或滚道出现剥落、擦伤等早期疲劳损伤。\n\n**应急处置建议：**\n1. **限速运行**：立即将列车限速至 120km/h 以下，并持续监控温度变化。\n2. **停车检查**：若温度持续上升超过 90℃ 或温升报警阈值，应就近安排停车，使用红外测温仪进行人工复核。\n3. **入库排查**：列车回库后，需拆解轴箱，提取润滑脂样本进行铁谱分析，并对轴承进行全面外观及探伤检查。";
        } else if (lastMessage.includes("绝缘")) {
          mockResponse = "### 高压牵引电机绝缘不良排查指南\n\n**质量整改记录调取：**\n系统已找到上个月关于“牵引电机绝缘不良”的 3 份整改报告。主要集中在 A 供应商的 2024 年第 2 批次产品。\n\n**排查指南：**\n1. **环境因素排查**：检查电机内部是否有积水、凝露或碳刷粉尘堆积。建议先进行干燥处理和清洁后再次测量。\n2. **接线盒检查**：重点检查接线盒内绝缘子是否有爬电痕迹，电缆接头包扎是否破损。\n3. **定子绕组检测**：使用兆欧表分别测量各相绕组对地及相间绝缘电阻，若低于 20MΩ，需进一步进行极化指数（PI）测试以评估绝缘老化程度。";
        } else if (lastMessage.includes("偏磨")) {
          mockResponse = "### 制动闸片异常偏磨风险评估\n\n**潜在风险评估：**\n1. **制动力下降**：偏磨会导致闸片与制动盘接触面积减小，降低制动效率，延长制动距离。\n2. **制动盘损伤**：严重的偏磨可能导致闸片背板直接接触制动盘，造成制动盘划伤或热斑。\n3. **异常振动与噪音**：不均匀的摩擦会导致制动时产生高频振动和尖锐噪音，影响乘坐舒适性。\n\n**预防措施：**\n1. **卡钳导向销润滑**：定期检查并润滑制动卡钳导向销，确保卡钳滑动顺畅，防止卡滞。\n2. **闸片间隙调整**：检查并校准制动缸的自动间隙调整器，确保两侧闸片间隙一致。\n3. **材质匹配性研究**：建议研发部门联合供应商，对当前批次闸片摩擦材料的均匀性进行抽样化验。";
        } else {
          mockResponse = "为了获得真实的智能回复，请在环境变量中配置 `GEMINI_API_KEY`。";
        }

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Mock token usage
        const mockUsage = {
          promptTokens: Math.floor(Math.random() * 50) + 100,
          completionTokens: Math.floor(Math.random() * 50) + 50,
          totalTokens: 0
        };
        mockUsage.totalTokens = mockUsage.promptTokens + mockUsage.completionTokens;

        return res.json({ role: 'assistant', content: mockResponse, usage: mockUsage });
      }

      // Format messages for Gemini
      const formattedMessages = messages.map((msg: any) => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }));

      // Natural, direct system instruction
      let systemInstruction = "You are Queen, an expert assistant for an industrial quality management system. Speak naturally, directly, and professionally in Chinese. Avoid cliché AI introductions like 'As an AI' or 'Hello, I am Queen'. Do not be overly polite or robotic. Get straight to the point. Provide concise, actionable insights.";
      
      if (context === 'issue') {
        systemInstruction += " Context: Assisting with issue (ISS-202604-001). Focus on troubleshooting this specific issue.";
      } else if (context === 'task') {
        systemInstruction += " Context: Assisting with task (TSK-202604-001). Focus on completing this task efficiently.";
      }

      if (references && references.length > 0) {
        systemInstruction += ` The user has attached the following references context: ${JSON.stringify(references)}. Use this context to inform your answers.`;
      }

      try {
        // Initialize Gemini API
        const ai = new GoogleGenAI({ apiKey });

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-pro',
          contents: formattedMessages,
          config: {
            systemInstruction: systemInstruction,
            temperature: 0.7,
          }
        });

        const usage = response.usageMetadata ? {
          promptTokens: response.usageMetadata.promptTokenCount,
          completionTokens: response.usageMetadata.candidatesTokenCount,
          totalTokens: response.usageMetadata.totalTokenCount
        } : { promptTokens: 150, completionTokens: 100, totalTokens: 250 };

        res.json({ 
          role: 'assistant', 
          content: response.text,
          usage
        });
      } catch (genAiError: any) {
        console.error("GenAI API Error:", genAiError);
        
        // Fallback to mock response if API key is invalid or other API errors occur
        console.log("Falling back to mock response due to API error.");
        const lastMessage = messages[messages.length - 1].content.toLowerCase();
        let mockResponse = "为了获得真实的智能回复，请在环境变量中配置有效的 `GEMINI_API_KEY`。";
        
        if (lastMessage.includes("踏面剥离")) {
          mockResponse = "### CRH380 车轮踏面剥离分析\n\n**故障原因分析：**\n1. **材质疲劳**：车轮长期在高速重载下运行，踏面表层金属产生疲劳微裂纹。\n2. **制动热应力**：频繁的紧急制动导致踏面局部温度急剧升高，随后快速冷却，产生热裂纹。\n3. **轮轨接触不良**：轨道不平顺或车轮踏面外形磨耗超限，导致接触应力集中。\n\n**历史案例检索：**\n- **案例编号 ISS-202305-042**：某局 CRH380A 动车组在运行 150 万公里后出现集中性踏面剥离，经查为该批次车轮材质碳含量偏高导致韧性不足。\n- **案例编号 ISS-202401-088**：冬季高寒地区运行的 CRH380B 频繁出现剥离，与冰雪天气下制动频繁及轮轨粘着系数降低有关。\n\n**推荐处置方案：**\n1. **立即执行**：对剥离长度超过 20mm 或深度超过 1mm 的车轮进行旋修作业。\n2. **短期预防**：加强对同批次车轮的超声波探伤频次，重点关注轮辋内部缺陷。\n3. **长期改善**：建议优化制动控制逻辑，减少单次高强度制动，并联合供应商评估车轮材质改进方案。";
        } else if (lastMessage.includes("温度过高")) {
          mockResponse = "### 转向架轴承温度过高报警分析\n\n**可能原因：**\n1. **润滑不良**：润滑脂变质、流失或加注量不足。\n2. **装配问题**：轴承游隙过小或过大，密封圈安装不当导致摩擦发热。\n3. **机械损伤**：滚子或滚道出现剥落、擦伤等早期疲劳损伤。\n\n**应急处置建议：**\n1. **限速运行**：立即将列车限速至 120km/h 以下，并持续监控温度变化。\n2. **停车检查**：若温度持续上升超过 90℃ 或温升报警阈值，应就近安排停车，使用红外测温仪进行人工复核。\n3. **入库排查**：列车回库后，需拆解轴箱，提取润滑脂样本进行铁谱分析，并对轴承进行全面外观及探伤检查。";
        } else if (lastMessage.includes("绝缘")) {
          mockResponse = "### 高压牵引电机绝缘不良排查指南\n\n**质量整改记录调取：**\n系统已找到上个月关于“牵引电机绝缘不良”的 3 份整改报告。主要集中在 A 供应商的 2024 年第 2 批次产品。\n\n**排查指南：**\n1. **环境因素排查**：检查电机内部是否有积水、凝露或碳刷粉尘堆积。建议先进行干燥处理和清洁后再次测量。\n2. **接线盒检查**：重点检查接线盒内绝缘子是否有爬电痕迹，电缆接头包扎是否破损。\n3. **定子绕组检测**：使用兆欧表分别测量各相绕组对地及相间绝缘电阻，若低于 20MΩ，需进一步进行极化指数（PI）测试以评估绝缘老化程度。";
        } else if (lastMessage.includes("偏磨")) {
          mockResponse = "### 制动闸片异常偏磨风险评估\n\n**潜在风险评估：**\n1. **制动力下降**：偏磨会导致闸片与制动盘接触面积减小，降低制动效率，延长制动距离。\n2. **制动盘损伤**：严重的偏磨可能导致闸片背板直接接触制动盘，造成制动盘划伤或热斑。\n3. **异常振动与噪音**：不均匀的摩擦会导致制动时产生高频振动和尖锐噪音，影响乘坐舒适性。\n\n**预防措施：**\n1. **卡钳导向销润滑**：定期检查并润滑制动卡钳导向销，确保卡钳滑动顺畅，防止卡滞。\n2. **闸片间隙调整**：检查并校准制动缸的自动间隙调整器，确保两侧闸片间隙一致。\n3. **材质匹配性研究**：建议研发部门联合供应商，对当前批次闸片摩擦材料的均匀性进行抽样化验。";
        } else {
          mockResponse = "为了获得真实的智能回复，请在环境变量中配置有效的 `GEMINI_API_KEY`。";
        }

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Mock token usage
        const mockUsage = {
          promptTokens: Math.floor(Math.random() * 50) + 100,
          completionTokens: Math.floor(Math.random() * 50) + 50,
          totalTokens: 0
        };
        mockUsage.totalTokens = mockUsage.promptTokens + mockUsage.completionTokens;

        return res.json({ role: 'assistant', content: mockResponse, usage: mockUsage });
      }
    } catch (error) {
      console.error("Chat API Error:", error);
      res.status(500).json({ error: "Failed to generate response" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
