// ia.js - Componente de IA para processamento de prompts
import axios from "axios";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config();

class AIService {
  constructor() {
    this.token = process.env.HF_TOKEN;
    this.baseURL = "https://router.huggingface.co/v1/chat/completions";
    
    if (!this.token) {
      console.warn("⚠️  HF_TOKEN não encontrado no .env");
    }
  }

  /**
   * Gera conteúdo usando IA
   * @param {string} prompt - O prompt para a IA
   * @param {Object} options - Opções adicionais
   * @returns {Promise<string>} - Resposta da IA
   */
  async gerarConteudo(prompt, options = {}) {
    try {
      if (!this.token) {
        throw new Error("Token do Hugging Face não configurado. Adicione HF_TOKEN no arquivo .env");
      }

      const defaultOptions = {
        model: "deepseek-ai/DeepSeek-R1:novita",
        max_tokens: 1000,
        temperature: 0.7,
        stream: false,
        ...options
      };

      console.log(`🤖 Processando prompt: "${prompt.substring(0, 50)}..."`);

      const response = await axios.post(
        this.baseURL,
        {
          messages: [
            {
              role: "user",
              content: prompt
            }
          ],
          model: defaultOptions.model,
          max_tokens: defaultOptions.max_tokens,
          temperature: defaultOptions.temperature,
          stream: defaultOptions.stream
        },
        {
          headers: {
            "Authorization": `Bearer ${this.token}`,
            "Content-Type": "application/json"
          },
          timeout: 60000 // 1 minuto timeout
        }
      );

      if (response.data.choices && response.data.choices.length > 0) {
        const conteudo = response.data.choices[0].message.content;
        console.log(`✅ Conteúdo gerado (${conteudo.length} caracteres)`);
        return conteudo;
      } else {
        throw new Error("Resposta da IA sem conteúdo");
      }

    } catch (error) {
      console.error("❌ Erro ao gerar conteúdo com IA:", error.message);
      
      // Fallback para modelo alternativo
      if (error.response?.data?.error?.code === 'model_not_supported') {
        console.log("🔄 Tentando modelo alternativo...");
        return this.gerarConteudo(prompt, {
          ...options,
          model: "deepseek-ai/DeepSeek-V3.2:novita"
        });
      }
      
      throw error;
    }
  }

  /**
   * Processa um template com dados específicos
   * @param {string} template - Template com placeholders {{variavel}}
   * @param {Object} dados - Dados para substituir no template
   * @returns {Promise<string>} - Conteúdo processado
   */
  async processarTemplate(template, dados) {
    // Substitui placeholders
    let prompt = template;
    for (const [key, value] of Object.entries(dados)) {
      prompt = prompt.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }

    return await this.gerarConteudo(prompt);
  }

  /**
   * Gera conteúdo a partir de um arquivo de prompt
   * @param {string} caminhoArquivo - Caminho para o arquivo .md
   * @param {Object} dados - Dados para o template
   * @returns {Promise<string>} - Conteúdo gerado
   */
  async gerarDeArquivo(caminhoArquivo, dados = {}) {
    try {
      const template = fs.readFileSync(caminhoArquivo, 'utf-8');
      return await this.processarTemplate(template, dados);
    } catch (error) {
      console.error(`❌ Erro ao ler arquivo ${caminhoArquivo}:`, error.message);
      throw error;
    }
  }
}

// Exporta uma instância única
export default new AIService();