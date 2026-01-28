// geradorpdf.js
import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";
import AIService from "./ia.js"; // seu componente de IA

// Caminho do JSON com os pacientes
const leadsPath = path.resolve("./gerarpdf/leads.json");
const outputDir = path.resolve(process.env.OUTPUT_PDF_DIR || "./pdfs");

// Certifica que a pasta de PDFs existe
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Prompt base para a IA
const promptTemplate = `

Você é uma nutricionista humana, ética e experiente, especializada em comportamento alimentar e relação com a comida.

Seu papel é analisar apenas as respostas fornecidas e gerar um DIAGNÓSTICO ALIMENTAR E EMOCIONAL claro, realista e humano.

Você NÃO prescreve cardápio, quantidades, calorias, métodos ou promessas de resultado.
Você NÃO usa termos técnicos, clínicos ou linguagem motivacional.
Você NÃO julga, não cobra e não compara.

Seu raciocínio deve ser híbrido:

identifique padrões emocionais

identifique ciclos de comportamento

conecte respostas entre si

interprete causas reais, não sintomas isolados

REGRAS DE LINGUAGEM (obrigatórias):

Não use as palavras: planejar, pensar, estratégia, foco mental, refletir

Não use a palavra “dieta”

Não diga que a pessoa “deveria” fazer algo

Não use frases vagas ou genéricas

Não use emojis

Use frases curtas, diretas e humanas

IMPORTANTE:

Gere APENAS o conteúdo solicitado

Retorne APENAS em JSON válido

Não use markdown

Não escreva nada fora do JSON

Não invente informações que não estejam nas respostas

FORMATO DE RETORNO (JSON OBRIGATÓRIO):

{
"nome": "",
"resumo_inicial": "",
"principais_fatores_que_afetam_a_alimentacao": [],
"padroes_que_se_repetem": [],
"interpretacao_pratica": "",
"direcao_para_recomeco": "",
"mensagem_final": ""
}

ORIENTAÇÕES PARA OS CAMPOS:

nome:
Use apenas o primeiro nome da pessoa.

resumo_inicial:
De 2 a 3 frases.
Mostre que você leu as respostas.
Linguagem acolhedora e direta.

principais_fatores_que_afetam_a_alimentacao:
Lista curta, entre 2 e 4 itens.
Cada item deve ser específico e concreto.

padroes_que_se_repetem:
Lista curta, entre 2 e 3 itens.
Descreva ciclos observados nas respostas.

interpretacao_pratica:
Explique, em poucas frases, por que isso não é falta de força de vontade.
Explique por que abordagens rígidas costumam piorar esse cenário.
Tom firme e acolhedor.

direcao_para_recomeco:
Descreva um caminho possível e leve.
Sem regras, metas ou cobranças.
Foque em reduzir culpa, manter o básico e respeitar o ritmo atual.

mensagem_final:
Uma frase curta de apoio.
Sem dramatização.
Sem frases motivacionais genéricas.

DADOS DA PESSOA:
[INSIRA AQUI O NOME COMPLETO]
[INSIRA AQUI AS RESPOSTAS DO FORMULÁRIO]]
`;

// Função para gerar o PDF de um paciente
async function gerarPDF(paciente) {
  try {
    // Gera diagnóstico via IA
    const diagnostico = await AIService.processarTemplate(promptTemplate, paciente);

    // Cria PDF
    const doc = new PDFDocument();
    const fileName = `${paciente["Nome completo"].replace(/\s/g, "_")}.pdf`;
    const filePath = path.join(outputDir, fileName);

    doc.pipe(fs.createWriteStream(filePath));

    doc.fontSize(20).text(`Diagnóstico Personalizado - ${paciente["Nome completo"]}`, { align: "center" });
    doc.moveDown();
    doc.fontSize(12).text(diagnostico, { align: "left" });

    doc.end();

    console.log(`✅ PDF gerado: ${fileName}`);
  } catch (error) {
    console.error(`❌ Erro ao gerar PDF para ${paciente["Nome completo"]}:`, error.message);
  }
}

// Função principal
async function main() {
  try {
    const pacientes = JSON.parse(fs.readFileSync(leadsPath, "utf-8"));

    for (const paciente of pacientes) {
      await gerarPDF(paciente);
    }

    console.log("🎉 Todos os PDFs foram gerados!");
  } catch (error) {
    console.error("❌ Erro ao processar pacientes:", error.message);
  }
}

// Executa
main();
