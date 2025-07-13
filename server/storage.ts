import { messages, regions, users, type Message, type Region, type User, type InsertMessage, type InsertRegion, type InsertUser } from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Message methods
  getMessages(limit?: number, offset?: number): Promise<Message[]>;
  getMessagesByRegion(region: string, limit?: number): Promise<Message[]>;
  getApprovedMessages(limit?: number, offset?: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  approveMessage(id: number): Promise<Message | undefined>;
  likeMessage(id: number): Promise<Message | undefined>;
  unlikeMessage(id: number): Promise<Message | undefined>;
  searchMessages(query: string, limit?: number): Promise<Message[]>;
  
  // Region methods
  getRegions(): Promise<Region[]>;
  getRegionByName(name: string): Promise<Region | undefined>;
  createRegion(region: InsertRegion): Promise<Region>;
  updateRegionMessageCount(regionName: string, count: number): Promise<Region | undefined>;
  
  // Statistics
  getTotalMessagesCount(): Promise<number>;
  getTotalRegionsCount(): Promise<number>;
  getTodayMessagesCount(): Promise<number>;
  getRegionStats(): Promise<Array<{ region: string; messageCount: number; percentage: number }>>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private messages: Map<number, Message>;
  private regions: Map<number, Region>;
  private currentUserId: number;
  private currentMessageId: number;
  private currentRegionId: number;

  constructor() {
    this.users = new Map();
    this.messages = new Map();
    this.regions = new Map();
    this.currentUserId = 1;
    this.currentMessageId = 1;
    this.currentRegionId = 1;
    
    // Initialize default regions
    this.initializeDefaultRegions();
  }

  private initializeDefaultRegions() {
    const defaultRegions = [
      { name: "서울특별시", code: "11", latitude: "37.5665", longitude: "126.9780" },
      { name: "부산광역시", code: "26", latitude: "35.1796", longitude: "129.0756" },
      { name: "대구광역시", code: "27", latitude: "35.8714", longitude: "128.6014" },
      { name: "인천광역시", code: "28", latitude: "37.4563", longitude: "126.7052" },
      { name: "광주광역시", code: "29", latitude: "35.1595", longitude: "126.8526" },
      { name: "대전광역시", code: "30", latitude: "36.3504", longitude: "127.3845" },
      { name: "울산광역시", code: "31", latitude: "35.5384", longitude: "129.3114" },
      { name: "세종특별자치시", code: "36", latitude: "36.4800", longitude: "127.2890" },
      { name: "경기도", code: "41", latitude: "37.4138", longitude: "127.5183" },
      { name: "강원도", code: "42", latitude: "37.8228", longitude: "128.1555" },
      { name: "충청북도", code: "43", latitude: "36.6357", longitude: "127.4917" },
      { name: "충청남도", code: "44", latitude: "36.5184", longitude: "126.8000" },
      { name: "전라북도", code: "45", latitude: "35.7175", longitude: "127.1530" },
      { name: "전라남도", code: "46", latitude: "34.8679", longitude: "126.9910" },
      { name: "경상북도", code: "47", latitude: "36.4919", longitude: "128.8889" },
      { name: "경상남도", code: "48", latitude: "35.4606", longitude: "128.2132" },
      { name: "제주특별자치도", code: "50", latitude: "33.4996", longitude: "126.5312" }
    ];

    defaultRegions.forEach(region => {
      const newRegion: Region = {
        id: this.currentRegionId++,
        name: region.name,
        code: region.code,
        messageCount: 0,
        latitude: region.latitude,
        longitude: region.longitude
      };
      this.regions.set(newRegion.id, newRegion);
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getMessages(limit = 50, offset = 0): Promise<Message[]> {
    const allMessages = Array.from(this.messages.values())
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
    return allMessages.slice(offset, offset + limit);
  }

  async getMessagesByRegion(region: string, limit = 50): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(message => message.region === region && message.isApproved)
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())
      .slice(0, limit);
  }

  async getApprovedMessages(limit = 50, offset = 0): Promise<Message[]> {
    const approvedMessages = Array.from(this.messages.values())
      .filter(message => message.isApproved)
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
    return approvedMessages.slice(offset, offset + limit);
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = this.currentMessageId++;
    const message: Message = {
      ...insertMessage,
      id,
      likes: 0,
      isApproved: true, // Auto-approve for demo
      createdAt: new Date(),
      subregion: insertMessage.subregion || null,
    };
    this.messages.set(id, message);
    
    // Update region message count
    const region = await this.getRegionByName(insertMessage.region);
    if (region) {
      await this.updateRegionMessageCount(region.name, (region.messageCount || 0) + 1);
    }
    
    return message;
  }

  async approveMessage(id: number): Promise<Message | undefined> {
    const message = this.messages.get(id);
    if (message) {
      message.isApproved = true;
      this.messages.set(id, message);
      return message;
    }
    return undefined;
  }

  async likeMessage(id: number): Promise<Message | undefined> {
    const message = this.messages.get(id);
    if (message) {
      message.likes = (message.likes || 0) + 1;
      this.messages.set(id, message);
      return message;
    }
    return undefined;
  }
    async unlikeMessage(id: number): Promise<Message | undefined> {
        const message = this.messages.get(id);
        if (message && message.likes && message.likes > 0) {
            message.likes = message.likes - 1;
            this.messages.set(id, message);
            return message;
        }
        return message;
    }

  async searchMessages(query: string, limit = 50): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(message => 
        message.isApproved && 
        (message.content.includes(query) || message.region.includes(query))
      )
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())
      .slice(0, limit);
  }

  async getRegions(): Promise<Region[]> {
    return Array.from(this.regions.values());
  }

  async getRegionByName(name: string): Promise<Region | undefined> {
    return Array.from(this.regions.values()).find(region => region.name === name);
  }

  async createRegion(insertRegion: InsertRegion): Promise<Region> {
    const id = this.currentRegionId++;
    const region: Region = { ...insertRegion, id, messageCount: 0 };
    this.regions.set(id, region);
    return region;
  }

  async updateRegionMessageCount(regionName: string, count: number): Promise<Region | undefined> {
    const region = await this.getRegionByName(regionName);
    if (region) {
      region.messageCount = count;
      this.regions.set(region.id, region);
      return region;
    }
    return undefined;
  }

  async getTotalMessagesCount(): Promise<number> {
    return Array.from(this.messages.values()).filter(message => message.isApproved).length;
  }

  async getTotalRegionsCount(): Promise<number> {
    return Array.from(this.regions.values()).filter(region => (region.messageCount || 0) > 0).length;
  }

  async getTodayMessagesCount(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Array.from(this.messages.values()).filter(message => 
      message.isApproved && 
      message.createdAt && 
      new Date(message.createdAt).getTime() >= today.getTime()
    ).length;
  }

  async getRegionStats(): Promise<Array<{ region: string; messageCount: number; percentage: number }>> {
    const regions = Array.from(this.regions.values())
      .filter(region => (region.messageCount || 0) > 0)
      .sort((a, b) => (b.messageCount || 0) - (a.messageCount || 0));
    
    const totalMessages = await this.getTotalMessagesCount();
    
    return regions.map(region => ({
      region: region.name,
      messageCount: region.messageCount || 0,
      percentage: totalMessages > 0 ? Math.round(((region.messageCount || 0) / totalMessages) * 100) : 0
    }));
  }
}

export const storage = new MemStorage();
