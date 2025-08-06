#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the current JSON storage file
const jsonStoragePath = path.join(__dirname, '..', 'server', 'json-storage.ts');

// Strategic priority skills (core technologies the company wants to develop)
const strategicSkills = [
  'React', 'TypeScript', 'Node.js', 'PostgreSQL', 'AWS', 'Docker', 
  'Kubernetes', 'Python', 'Java', 'Spring Boot', 'Django', 'Vue.js',
  'Angular', 'GraphQL', 'Redis', 'Machine Learning', 'TensorFlow',
  'Microservices', 'CI/CD', 'Jenkins', 'Git', 'Agile', 'Scrum'
];

async function addStrategicPriorityToSkills() {
  try {
    // First, let's update the in-memory storage initialization
    let storageContent = fs.readFileSync(path.join(__dirname, '..', 'server', 'storage.ts'), 'utf8');
    
    // Add strategicPriority: false to all existing skills that don't have it
    storageContent = storageContent.replace(
      /{ id: (\d+), name: "([^"]+)", purpose: "([^"]+)", categoryId: (\d+), knowledgeAreaId: (\d+) }/g,
      (match, id, name, purpose, categoryId, knowledgeAreaId) => {
        const isStrategic = strategicSkills.includes(name);
        return `{ id: ${id}, name: "${name}", purpose: "${purpose}", categoryId: ${categoryId}, knowledgeAreaId: ${knowledgeAreaId}, strategicPriority: ${isStrategic} }`;
      }
    );

    // Write the updated content back to the file
    fs.writeFileSync(path.join(__dirname, '..', 'server', 'storage.ts'), storageContent);

    console.log('✅ Successfully added strategicPriority field to all skills in storage.ts');
    console.log(`📊 Strategic skills marked: ${strategicSkills.length}`);
    
  } catch (error) {
    console.error('❌ Error updating skills:', error);
  }
}

// Run the script
addStrategicPriorityToSkills();