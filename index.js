// Inicio - Relic Zero
import { Client, GatewayIntentBits, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle, Message } from "discord.js";
import admin from "firebase-admin";
import * as dotenv from "dotenv";

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

admin.initializeApp({
    credential: admin.credential.cert("firebase.json")
});

const db = admin.firestore();

// Prefixo
const prefixo = {
    simbolo: ">"
}

// Base dos comandos
const comandos = new Map();

// Função para adicionar comandos
function evento(nome, valor) {
    comandos.set(nome, valor);
}

client.on("ready", () => {
    console.log(`${client.user.tag} Pronto!!!`);
});

dotenv.config();

client.login(process.env.TOKEN);

client.on("messageCreate", async message => {
    if (message.author.bot) return;

    const partesMensagem = message.content.slice(prefixo.simbolo.length).trim().split(/ +/);
    const comando = partesMensagem.shift().toLowerCase();
    const argumento = partesMensagem.join(' ');

    if (comandos.has(comando)) {
        comandos.get(comando)(message, argumento);
    }
});

// Comando >Create
import { criarPerfil } from './estrutura/criarPerfil.js';
evento("create", async (message) => {
    const perfilDoc = await db.collection('perfis').doc(message.author.id).get();

    if (perfilDoc.exists) {
        message.reply('Seu perfil já foi criado!');
    } else {
        criarPerfil(message, db);
    }
});

// Comando >Delete
evento("delete", async (message) => {
    const perfilDoc = await db.collection('perfis').doc(message.author.id).get();
    if (perfilDoc.exists) {
        await db.collection('perfis').doc(message.author.id).delete();
        message.reply('Seu perfil foi excluído com sucesso.');
    } else {
        message.reply('Você não tem um perfil para excluir.');
    }
});

// Comando >profile
evento("profile", async (message) => {
    // Verifica se um usuário foi mencionado
    const mention = message.mentions.users.first();
    const targetId = mention ? mention.id : message.author.id;

    const perfilDoc = await db.collection('perfis').doc(targetId).get();
    if (perfilDoc.exists) {
        const perfilData = perfilDoc.data();
        const embedPerfil = new EmbedBuilder()
            .setColor(perfilData.cor)
            .setTitle("Cartão de Identificação")
            .setThumbnail(perfilData.foto)
            .addFields(
                { name: 'Nome', value: `${perfilData.nome}`, inline: true },
                { name: 'Classe', value: `${perfilData.classe}`, inline: true },
                { name: 'Reputação', value: `${perfilData.respeito}`, inline: true },
            )
            .addFields(
                { name: 'Vida', value: `${perfilData.vida}`, inline: true },
                { name: 'Sanidade', value: `${perfilData.sanidade}`, inline: true },
                { name: 'Estamina', value: `${perfilData.estamina}`, inline: true },
            )
            .addFields(
                { name: 'Atributo', value: `${perfilData.atributoTOTAL}`, inline: true },
                { name: 'Vantagem', value: `${perfilData.vantagemTOTAL}`, inline: true },
                { name: 'Virtude', value: `${perfilData.virtudeTOTAL}`, inline: true },
            )
            .addFields(
                { name: 'Corpo', value: `${perfilData.corpo}`, inline: true },
                { name: 'Reflexo', value: `${perfilData.reflexos}`, inline: true },
                { name: 'Tecnologia', value: `${perfilData.tecnologia}`, inline: true },
            )
            .addFields(
                { name: 'Inteligencia', value: `${perfilData.inteligência}`, inline: true },
                { name: 'Moral', value: `${perfilData.moral}`, inline: true },
                { name: 'Relic', value: `${perfilData.especial}`, inline: true },
            )
            .addFields(
                { name: 'Historia ->', value: "Teste" },
            )

        await message.channel.send({ embeds: [embedPerfil] });
    } else {
        if (mention) {
            message.reply(`O perfil de ${mention.username} ainda não foi criado.`);
        } else {
            message.reply('Seu perfil ainda não foi criado. Use `>create` para criar um.');
        }
    }
});

evento("habilidades", async (message) => {
    const profile = await db.collection('perfis').doc(message.author.id).get();
    if (!profile.exists) {
        message.reply('Seu perfil ainda não foi criado. Use `>create` para criar um.');
        return;
    }

    const perfilData = profile.data();
    const habilidades = perfilData.habilidades;

    if (habilidades.length === 0) {
        message.reply('Você não tem habilidades.');
    } else {
        let inventoryMessage = 'Inventário de Habilidades:\n';
        habilidades.forEach((habilidade, index) => {
            inventoryMessage += `${index + 1}. ${habilidade.nome} - ${habilidade.descricao}\n`;
        });
        message.reply(inventoryMessage);
    }
});

import { carregarHabilidadesCorpo } from "./estrutura/carregarHabilidades.js";
evento("corpo", async (message) => {
    const habilidades = carregarHabilidadesCorpo();

        habilidades.forEach((habilidade, index) => {
            const embed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle(`${index + 1}. ${habilidade.nome}`)
                .setDescription(habilidade.descricao);

            message.channel.send({ embeds: [embed] });
        });
    }
);