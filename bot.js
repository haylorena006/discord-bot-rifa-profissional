const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const QRCode = require('qrcode');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });
const dbFilePath = './raffleData.json';

// Initialize raffle data
let raffleData = { tickets: [], channelId: '', status: '', approvalQueue: {} };

// Load raffle data
if (fs.existsSync(dbFilePath)) {
    raffleData = JSON.parse(fs.readFileSync(dbFilePath));
}

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
});

// Command: .startRaffle
client.on('messageCreate', async (message) => {
    if (!message.content.startsWith('.') || message.author.bot) return;
    const [command, ...args] = message.content.slice(1).trim().split(/ +/);

    if (command === 'startRaffle') {
        raffleData.status = 'running';
        raffleData.tickets = [];
        raffleData.channelId = message.channel.id;
        await message.channel.send('Raffle started! Use `.buy <name> <quota>` to buy a ticket.');
        fs.writeFileSync(dbFilePath, JSON.stringify(raffleData));
    }
});

// Command: .buy <name> <quota>
client.on('messageCreate', async (message) => {
    if (!message.content.startsWith('.') || message.author.bot) return;
    const [command, buyerName, quota] = message.content.slice(1).trim().split(/ +/);

    if (command === 'buy') {
        if (raffleData.status !== 'running') return message.channel.send('No raffle is currently running.');

        const ticketNumber = generateUniqueTicketNumber(raffleData.tickets);
        raffleData.tickets.push({ ticketNumber, buyerName, quota });

        const qrCodeDataUrl = await QRCode.toDataURL(`Ticket Number: ${ticketNumber}\nName: ${buyerName}\nQuota: ${quota}`);
        await message.channel.send(`Ticket purchased: ${ticketNumber} by ${buyerName} for ${quota} quota.\nQR Code: ${qrCodeDataUrl}`);
        fs.writeFileSync(dbFilePath, JSON.stringify(raffleData));
    }
});

function generateUniqueTicketNumber(tickets) {
    let ticketNumber;
    do {
        ticketNumber = Math.floor(Math.random() * 9000) + 1000; // 4-digit number
    } while (tickets.find(ticket => ticket.ticketNumber === ticketNumber));
    return ticketNumber;
}

// Command: .approve <ticketNumber>
client.on('messageCreate', async (message) => {
    const [command, ticketNumber] = message.content.slice(1).trim().split(/ +/);

    if (command === 'approve') {
        const ticket = raffleData.tickets.find(t => t.ticketNumber === parseInt(ticketNumber));
        if (ticket) {
            // Logic to approve ticket
            await message.channel.send(`Ticket ${ticketNumber} approved!`);
            fs.writeFileSync(dbFilePath, JSON.stringify(raffleData));
        } else {
            await message.channel.send(`No ticket found with number ${ticketNumber}`);
        }
    }
});

client.login('YOUR_BOT_TOKEN');