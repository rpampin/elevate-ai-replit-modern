const clients = [
  { name: "Talent Pool", description: "Internal talent pool for available team members" },
  { name: "TechCorp Solutions", description: "Enterprise software development and consulting" },
  { name: "FinanceFlow", description: "Financial technology and banking solutions" },
  { name: "HealthTech Solutions", description: "Healthcare technology and medical software" },
  { name: "RetailMax", description: "E-commerce and retail technology solutions" },
  { name: "EduTech Pro", description: "Educational technology and learning platforms" },
  { name: "DataVault Systems", description: "Big data analytics and data management" },
  { name: "CloudFirst Technologies", description: "Cloud infrastructure and migration services" },
  { name: "MobileApp Innovations", description: "Mobile application development and UX design" },
  { name: "SecureNet Solutions", description: "Cybersecurity and network protection services" },
  { name: "AgriTech Partners", description: "Agricultural technology and IoT solutions" },
  { name: "InnovateLab", description: "Research and development for emerging technologies" }
];

async function createClients() {
  console.log('Creating clients...');
  for (const client of clients) {
    try {
      const response = await fetch('http://localhost:5000/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(client)
      });
      const result = await response.json();
      console.log(`Created: ${result.name}`);
    } catch (error) {
      console.error(`Error creating ${client.name}:`, error.message);
    }
  }
  console.log('All clients created!');
}

createClients().catch(console.error);
