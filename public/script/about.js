import { db } from './firebase.js';
import { collection, getDocs, query, orderBy } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

async function displayMembers() {
  const chairpersonList = document.getElementById('chairperson-list');
  const viceChairpersonList = document.getElementById('vice-chairperson-list');
  const secretariatList = document.getElementById('secretariat-list');
  const membersList = document.getElementById('members-list');

  if (!chairpersonList || !viceChairpersonList || !secretariatList || !membersList) {
    console.error('One or more member list containers are missing.');
    return;
  }

  try {
    // Fetch members from Firestore
    const membersRef = collection(db, 'members');
    const q = query(membersRef, orderBy('createdAt')); // Order by createdAt
    const querySnapshot = await getDocs(q);

    // Clear all lists before displaying the new members
    chairpersonList.innerHTML = '';
    viceChairpersonList.innerHTML = '';
    secretariatList.innerHTML = '';
    membersList.innerHTML = '';

    // Loop through each member and classify by their role
    querySnapshot.forEach((doc) => {
      const member = doc.data();
      const memberCard = createMemberCard(member); // Create a card for the member

      // Add the member to the appropriate list based on their role
      if (member.position === 'Chairperson') {
        chairpersonList.appendChild(memberCard);
      } else if (member.position === 'Vice-Chairperson') {
        viceChairpersonList.appendChild(memberCard);
      } else if (member.position === 'Secretary') {
        secretariatList.appendChild(memberCard);
      } else if (member.position === 'Member') {
        membersList.appendChild(memberCard);
      }
    });
  } catch (error) {
    console.error('Error fetching members:', error);
  }
}

// Function to create member card
function createMemberCard(member) {
  const memberCard = document.createElement('div');
  memberCard.classList.add('member-card');

  memberCard.innerHTML = `
    <img src="${member.photoURL}" alt="${member.name}'s photo" class="member-photo">
    <div class="member-info">
      <h4>${member.name}</h4>
      <p><strong> ${member.role} </strong> </p>
      <p><strong> ${member.position} </strong></p>
    </div>
  `;

  return memberCard;
}

// Call the function to display members after the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  displayMembers();
});
