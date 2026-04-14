export interface ClassSection {
  title: string;
  startTime: string;
  endTime: string;
  days: string[];
  building: string;
  room: string;
  instructor: string;
}

export interface Schedule {
  id: number;
  name: string;
  sections: ClassSection[];
}

export const mockSchedules: Schedule[] = [
  {
    id: 1,
    name: "Fall 2026",
    sections: [
      {
        title: "CS 112-001",
        startTime: "09:00",
        endTime: "09:50",
        days: ["M", "W", "F"],
        building: "Exploratory Hall",
        room: "1000",
        instructor: "Dr. Ada Lovelace"
      },
      {
        title: "MATH 203-004",
        startTime: "10:30",
        endTime: "11:45",
        days: ["T", "R"],
        building: "Innovation Hall",
        room: "206",
        instructor: "Dr. Henri Poincare"
      },
      {
        title: "ENGH 101-015",
        startTime: "13:30",
        endTime: "14:45",
        days: ["M", "W"],
        building: "Robinson Hall",
        room: "B104",
        instructor: "Prof. Zora Neale"
      },
      {
        title: "PHYS 160-002",
        startTime: "12:00",
        endTime: "13:15",
        days: ["T", "R"],
        building: "Planetary Hall",
        room: "120",
        instructor: "Dr. Lise Meitner"
      },
      {
        title: "CS 112-L02",
        startTime: "15:00",
        endTime: "16:50",
        days: ["F"],
        building: "Exploratory Hall",
        room: "L102",
        instructor: "Sam Tran"
      }
    ]
  },
  {
    id: 2,
    name: "Spring 2027",
    sections: [
      {
        title: "CS 211-003",
        startTime: "08:00",
        endTime: "09:15",
        days: ["M", "W"],
        building: "Nguyen Engineering",
        room: "1103",
        instructor: "Dr. Grace Hopper"
      },
      {
        title: "STAT 344-001",
        startTime: "10:30",
        endTime: "11:45",
        days: ["T", "R"],
        building: "Enterprise Hall",
        room: "178",
        instructor: "Dr. Ronald Fisher"
      },
      {
        title: "HIST 100-011",
        startTime: "13:30",
        endTime: "14:45",
        days: ["M", "W"],
        building: "Robinson Hall",
        room: "A206",
        instructor: "Prof. Ibn Khaldun"
      },
      {
        title: "PHIL 173-002",
        startTime: "15:00",
        endTime: "16:15",
        days: ["T", "R"],
        building: "Horizon Hall",
        room: "3009",
        instructor: "Dr. Hypatia"
      }
    ]
  },
  {
    id: 3,
    name: "Summer 2027",
    sections: [
      {
        title: "CS 306-001",
        startTime: "09:00",
        endTime: "11:15",
        days: ["M", "T", "W", "R"],
        building: "Exploratory Hall",
        room: "1004",
        instructor: "Dr. Barbara Liskov"
      },
      {
        title: "MATH 261-001",
        startTime: "13:00",
        endTime: "15:15",
        days: ["M", "W"],
        building: "Exploratory Hall",
        room: "3301",
        instructor: "Dr. Emmy Noether"
      }
    ]
  }
];
