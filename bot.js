// bot.js

const { Client, Intents } = require('discord.js');
const qrcode = require('qrcode');
const { MongoClient } = require('mongodb');

// Configuration validation
const config = require('./config.json');
const uri = config.databaseURI;
if (!uri) throw new Error('Database URI not defined');

const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });

// Database connection
let db;
MongoClient.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(client => {
        db = client.db('dbname');
    })
    .catch(err => console.error('Database connection failed:', err));

// Utility to check admin permissions
function isAdmin(member) {
    return member.permissions.has('ADMINISTRATOR');
}

// Error handling middleware
client.on('error', error => console.error('Client error:', error));

// Commands
client.on('messageCreate', async message => {
    try {
        if (message.content.startsWith('!generate')) {
            // Number generation using Set
            const uniqueNumbers = new Set();
            while (uniqueNumbers.size < 10) {
                uniqueNumbers.add(Math.floor(Math.random() * 100));
            }
            message.channel.send(`Generated Numbers: ${[...uniqueNumbers].join(', ')}`);
        }

        if (isAdmin(message.member)) {
            if (message.content.startsWith('!qr')) {
                const url = message.content.split(' ')[1];
                const qrCode = await qrcode.toDataURL(url);
                message.channel.send({ files: [{ attachment: qrCode, name: 'qrcode.png' }] });
            }

            if (message.content.startsWith('!ticket')) {
                const quota = message.content.split(' ')[1];
                await db.collection('tickets').insertOne({ username: message.author.username, quota });
                message.channel.send(`Ticket created for ${message.author.username} with quota ${quota}`);
            }

            if (message.content.startsWith('!bulkDelete')) {
                const messages = await message.channel.messages.fetch({ limit: 100 });
                message.channel.bulkDelete(messages);
                message.channel.send('Deleted messages successfully.');
            }

            // Embed example
            const embed = new MessageEmbed()
                .setTitle('Professional Embed')
                .setDescription('This is a professional embed example.')
                .setColor('#0099ff');
            message.channel.send({ embeds: [embed] });
        } else {
            message.channel.send('You do not have permission to use this command.');
        }
    } catch (err) {
        console.error('Error handling message:', err);
        message.channel.send('An error occurred while processing your command.');
    }
});

// Ranking command
client.on('messageCreate', async message => {
    if (message.content === '!ranking') {
        const users = await db.collection('users').find().toArray();
        const sortedUsers = users.sort((a, b) => b.points - a.points);
        message.channel.send(`Ranking: ${sortedUsers.map(user => user.username).join(', ')}`);
    }
});

// Status command
setInterval(() => {
    const statusMessages = ['Online', 'Raffle is live!', 'Tickets available!'];
    const randomStatus = statusMessages[Math.floor(Math.random() * statusMessages.length)];
    client.user.setPresence({ activities: [{ name: randomStatus }], status: 'online' });
}, 10000);

// Initialize the bot
client.login(config.token);
