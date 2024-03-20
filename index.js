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
        let inventoryMessage = `Habilidades de ${perfilData.nome}:\n`;
        habilidades.forEach((habilidade, index) => {
            inventoryMessage += `${index + 1}. ${habilidade.nome} - ${habilidade.descricao}\n`;
        });

        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('Lista de Habilidades')
            .setDescription(inventoryMessage);

        message.channel.send({ embeds: [embed] });
    }
});

import { carregarHabilidadesCorpo } from "./estrutura/carregarHabilidades.js";
import { converterParaRomano } from "./estrutura/converterParaRomano.js";
evento("corpo", async (message, argumento) => {
    const habilidades = carregarHabilidadesCorpo();

    if (argumento) {
        const habilidadeEncontrada = habilidades.find(habilidade => habilidade.nome.toLowerCase() === argumento.toLowerCase());

        if (habilidadeEncontrada) {
            const embed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle(`${habilidadeEncontrada.nome}`)
                .setDescription(`${habilidadeEncontrada.descricao}`)
                .setThumbnail(habilidadeEncontrada.foto)
                .addFields(
                    { name: 'Efeito', value: `${habilidadeEncontrada.efeito}`, inline: true },
                    { name: 'Custo', value: `${habilidadeEncontrada.custo.tipo}: ${habilidadeEncontrada.custo.atributoRequerido}`, inline: true },
                    { name: 'Corpo', value: `Nível: ${converterParaRomano(habilidadeEncontrada.custo.nivelCorpo)}`, inline: true }
                );

            // Verifica se há necessidades para essa habilidade
            if (habilidadeEncontrada.necessidade && habilidadeEncontrada.necessidade.length > 0) {
                const necessidadesString = habilidadeEncontrada.necessidade.join(', ');
                embed.addFields({ name: 'Requisitos', value: `${necessidadesString}`, inline: true });
            }

            // Verifica se há informações de upgrade
            if (habilidadeEncontrada.upgrade && habilidadeEncontrada.upgrade.tipo) {
                embed.addFields({ name: 'Upgrade', value: `${habilidadeEncontrada.upgrade.tipo}: ${habilidadeEncontrada.upgrade.custo}`, inline: true });
            }

            message.channel.send({ embeds: [embed] });
        } else {
            message.channel.send("Habilidade não encontrada.");
        }
    } else {
        const habilidadesLista = habilidades.map(habilidade => `${converterParaRomano(habilidade.custo.nivelCorpo)} - ${habilidade.nome}`).join('\n');
        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('Lista de Habilidades')
            .setDescription(habilidadesLista);

        message.channel.send({ embeds: [embed] });
    }
});

// Comando !dar
evento("adquirir", async (message, argumento) => {
    // Carrega as habilidades disponíveis para dar
    const habilidades = carregarHabilidadesCorpo();
    // Verifica se a habilidade solicitada existe
    const habilidadeEncontrada = habilidades.find(habilidade => habilidade.nome.toLowerCase() === argumento.toLowerCase());
    if (!habilidadeEncontrada) {
        message.reply('A habilidade especificada não foi encontrada.');
        return;
    }
    // Obtém o documento de perfil do autor da mensagem
    const perfilDoc = await db.collection('perfis').doc(message.author.id).get();
    // Verifica se o perfil do autor da mensagem existe
    if (!perfilDoc.exists) {
        message.reply('Seu perfil ainda não foi criado. Use `>create` para criar um.');
        return;
    }
    // Adiciona a habilidade ao array de habilidades do autor da mensagem no Firebase
    await db.collection('perfis').doc(message.author.id).update({
        habilidades: admin.firestore.FieldValue.arrayUnion({
            nome: habilidadeEncontrada.nome,
            descricao: habilidadeEncontrada.descricao
        })
    });
    message.reply(`A habilidade "${habilidadeEncontrada.nome}" foi dada para você.`);
});

// Comando !esquecer
evento("esquecer", async (message, argumento) => {
    // Verifica se uma habilidade foi especificada
    if (!argumento) {
        message.reply('Por favor, especifique o nome da habilidade que deseja esquecer.');
        return;
    }
    // Obtém o documento de perfil do autor da mensagem
    const perfilDoc = await db.collection('perfis').doc(message.author.id).get();
    // Verifica se o perfil do autor da mensagem existe
    if (!perfilDoc.exists) {
        message.reply('Seu perfil ainda não foi criado. Use `>create` para criar um.');
        return;
    }
    // Obtém os dados do perfil do autor da mensagem
    const perfilData = perfilDoc.data();
    // Verifica se o autor da mensagem possui a habilidade especificada
    const habilidadeIndex = perfilData.habilidades.findIndex(habilidade => habilidade.nome.toLowerCase() === argumento.toLowerCase());
    if (habilidadeIndex === -1) {
        message.reply(`Você não possui a habilidade "${argumento}".`);
        return;
    }
    // Remove a habilidade do array de habilidades do autor da mensagem no Firebase
    const novasHabilidades = perfilData.habilidades.filter((_, index) => index !== habilidadeIndex);
    await db.collection('perfis').doc(message.author.id).update({
        habilidades: novasHabilidades
    });
    message.reply(`A habilidade "${argumento}" foi removida do seu perfil.`);
});