
/**
 * $prompt一行内容input提交封装
 * @param inputType input type 类型
 * @param title 标题
 * @param val 回显的值
 * @returns {Promise<any>}
 */
export default function modalPrompt(inputType, title, val, maxLength = 50) {
  return new Promise((resolve, reject) => {
    this.$prompt('', `${title}`, {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputErrorMessage: `请输入${title}`,
      inputType: inputType,
      inputValue: val ? val : '',
      showClose: true,
      closeOnClickModal: false,
      customClass: 'prompt-form',
      inputPlaceholder: `请输入${title}`,
      inputValidator: (value) => {
        if (!value && value !== 0) return '输入不能为空';
        if (value.length > maxLength) return `输入限制${maxLength}字以内`;
      },
      beforeClose: (action, instance, done) => {
        if (action === 'confirm') {
          instance.confirmButtonLoading = true;
          instance.confirmButtonText = '执行中...';
          setTimeout(() => {
            done();
            instance.confirmButtonLoading = false;
          }, 200);
        } else {
          done();
        }
      },
    })
      .then(({ value }) => {
        resolve(value);
      })
      .catch(() => {
        this.$message.info('取消输入');
      });
  });
}
