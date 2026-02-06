 

export default {
  shortcuts: [
    {
      text: '本月',
      onClick(picker) {
        picker.$emit('pick', [new Date(), new Date()]);
      },
    },
    {
      text: '今年至今',
      onClick(picker) {
        const end = new Date();
        const start = new Date(new Date().getFullYear(), 0);
        picker.$emit('pick', [start, end]);
      },
    },
    {
      text: '最近六个月',
      onClick(picker) {
        const end = new Date();
        const start = new Date();
        start.setMonth(start.getMonth() - 6);
        picker.$emit('pick', [start, end]);
      },
    },
  ],
};
